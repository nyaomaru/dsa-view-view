import type {
  ShareStateDecodeResult,
  ShareStateV1,
} from '@/entities/share-state'
import {
  arrayOf,
  isArray,
  isBoolean,
  isFunction,
  isInteger,
  isNull,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  isUndefined,
  lazy,
  oneOfValues,
  or,
  recordOf,
  safeJsonParse,
  type Guard,
} from '@/shared/lib/guards'
import {
  SHARE_DECODED_JSON_MAX_LENGTH,
  SHARE_DECOMPRESSED_BYTES_MAX_LENGTH,
  SHARE_ENCODED_TOKEN_MAX_LENGTH,
  SHARE_INPUT_JSON_MAX_LENGTH,
  SHARE_SOURCE_CODE_MAX_LENGTH,
} from './share-state-limits'

const COMPRESSED_PREFIX = 'c.'
const JSON_PREFIX = 'j.'
const SHARE_STATE_VERSION = 1
const SHARE_STATE_PREFIX_LENGTH = COMPRESSED_PREFIX.length
const BASE64_PADDING_BLOCK_SIZE = 4
const BASE64_BINARY_CHUNK_SIZE = 0x8000
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const isSupportedLanguage = oneOfValues('typescript')
const isShareMode = oneOfValues('editor', 'verification', 'runtime')

type DecompressionResult =
  | { success: true; bytes: Uint8Array }
  | { success: false; reason: 'invalid-encoding' | 'too-large' }

function stableStringify(value: unknown): string {
  if (isNull(value) || !isObject(value)) return JSON.stringify(value)
  if (isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, entryValue]) => !isUndefined(entryValue)
  )

  return `{${entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${stableStringify(entryValue)}`
    )
    .join(',')}}`
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (let index = 0; index < bytes.length; index += BASE64_BINARY_CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.slice(index, index + BASE64_BINARY_CHUNK_SIZE)
    )
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

function toBlobPart(bytes: Uint8Array): BlobPart {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer as ArrayBuffer
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
    const padded = normalized.padEnd(
      normalized.length +
        ((BASE64_PADDING_BLOCK_SIZE -
          (normalized.length % BASE64_PADDING_BLOCK_SIZE)) %
          BASE64_PADDING_BLOCK_SIZE),
      '='
    )
    const binary = atob(padded)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

async function compress(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (
    isUndefined(globalThis.CompressionStream) ||
    !isFunction(Reflect.get(Blob.prototype, 'stream'))
  ) {
    return null
  }

  const stream = new Blob([toBlobPart(bytes)])
    .stream()
    .pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function decompress(bytes: Uint8Array): Promise<DecompressionResult> {
  if (
    isUndefined(globalThis.DecompressionStream) ||
    !isFunction(Reflect.get(Blob.prototype, 'stream'))
  ) {
    return { success: false, reason: 'invalid-encoding' }
  }

  try {
    const reader = new Blob([toBlobPart(bytes)])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'))
      .getReader()
    const chunks: Uint8Array[] = []
    let totalLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalLength += value.byteLength
      if (totalLength > SHARE_DECOMPRESSED_BYTES_MAX_LENGTH) {
        await reader.cancel()
        return { success: false, reason: 'too-large' }
      }

      chunks.push(value)
    }

    const decompressed = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      decompressed.set(chunk, offset)
      offset += chunk.byteLength
    }

    return { success: true, bytes: decompressed }
  } catch {
    return { success: false, reason: 'invalid-encoding' }
  }
}

type JsonCompatible =
  | string
  | number
  | boolean
  | null
  | readonly JsonCompatible[]
  | JsonCompatibleRecord

interface JsonCompatibleRecord {
  readonly [key: string]: JsonCompatible
}

const isJsonCompatible: Guard<JsonCompatible> = lazy(() => oneOfJsonTypes())

const oneOfJsonTypes = (): Guard<JsonCompatible> => {
  const isJsonArray = arrayOf(isJsonCompatible)
  const isJsonRecord = recordOf(isString, isJsonCompatible)
  return or(isNull, isString, isBoolean, isNumber, isJsonArray, isJsonRecord)
}

function validateShareState(value: unknown): ShareStateDecodeResult {
  if (!isPlainObject(value)) return { success: false, reason: 'invalid-state' }
  if (value.v !== SHARE_STATE_VERSION) {
    return {
      success: false,
      reason: isNumber(value.v) ? 'unsupported-version' : 'invalid-state',
    }
  }

  if (!isUndefined(value.l) && !isSupportedLanguage(value.l)) {
    return { success: false, reason: 'invalid-state' }
  }
  if (!isUndefined(value.e) && !isString(value.e)) {
    return { success: false, reason: 'invalid-state' }
  }
  if (!isUndefined(value.c)) {
    if (!isString(value.c) || value.c.length > SHARE_SOURCE_CODE_MAX_LENGTH) {
      return { success: false, reason: 'too-large' }
    }
  }
  if (!isUndefined(value.i)) {
    if (!isPlainObject(value.i) || !isJsonCompatible(value.i)) {
      return { success: false, reason: 'invalid-state' }
    }
    if (stableStringify(value.i).length > SHARE_INPUT_JSON_MAX_LENGTH) {
      return { success: false, reason: 'too-large' }
    }
  }
  if (!isUndefined(value.m) && !isShareMode(value.m)) {
    return { success: false, reason: 'invalid-state' }
  }
  if (!isUndefined(value.p) && (!isInteger(value.p) || value.p < 0)) {
    return { success: false, reason: 'invalid-state' }
  }
  if (isUndefined(value.e) && isUndefined(value.c)) {
    return { success: false, reason: 'invalid-state' }
  }

  return { success: true, state: value as ShareStateV1 }
}

export async function encodeShareState(state: ShareStateV1): Promise<string> {
  const json = stableStringify(state)
  const bytes = textEncoder.encode(json)
  const compressed = await compress(bytes)

  if (!isNull(compressed) && compressed.length < bytes.length) {
    return `${COMPRESSED_PREFIX}${bytesToBase64Url(compressed)}`
  }

  return `${JSON_PREFIX}${bytesToBase64Url(bytes)}`
}

export async function decodeShareState(
  encoded: string
): Promise<ShareStateDecodeResult> {
  if (encoded.length > SHARE_ENCODED_TOKEN_MAX_LENGTH) {
    return { success: false, reason: 'too-large' }
  }

  const isCompressed = encoded.startsWith(COMPRESSED_PREFIX)
  const isJson = encoded.startsWith(JSON_PREFIX)

  if (!isCompressed && !isJson) {
    return { success: false, reason: 'invalid-encoding' }
  }

  const bytes = base64UrlToBytes(encoded.slice(SHARE_STATE_PREFIX_LENGTH))
  if (isNull(bytes)) return { success: false, reason: 'invalid-encoding' }

  const decompressionResult = isCompressed
    ? await decompress(bytes)
    : { success: true as const, bytes }
  if (!decompressionResult.success) {
    return { success: false, reason: decompressionResult.reason }
  }

  const decodedBytes = decompressionResult.bytes
  if (decodedBytes.byteLength > SHARE_DECOMPRESSED_BYTES_MAX_LENGTH) {
    return { success: false, reason: 'too-large' }
  }

  const json = textDecoder.decode(decodedBytes)
  if (json.length > SHARE_DECODED_JSON_MAX_LENGTH) {
    return { success: false, reason: 'too-large' }
  }

  const parsed = safeJsonParse(json, isJsonCompatible)
  if (!parsed.valid) {
    return { success: false, reason: 'invalid-json' }
  }
  return validateShareState(parsed.value)
}
