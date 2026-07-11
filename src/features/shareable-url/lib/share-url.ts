import type {
  ShareStateDecodeResult,
  ShareStateV1,
} from '@/entities/share-state'
import { isString, isUndefined, oneOfValues } from '@/shared/lib/guards'
import { encodeShareState, decodeShareState } from './share-state-codec'
import {
  SHARE_URL_MAX_LENGTH,
  SHARE_URL_WARNING_LENGTH,
} from './share-state-limits'

export type ShareUrlResult =
  | { success: true; url: string; warning?: 'long-url' }
  | { success: false; reason: 'too-large' }

type ShareUrlOptions = {
  /** Share URL encoding format. */
  format?: 'canonical' | 'token'
}

type ShareableExample = {
  /** Stable example identifier. */
  id: string
  /** Source code associated with the example. */
  sourceCode: string
  /** Optional default input values for the example. */
  defaultInputValues?: Record<string, unknown>
}

type LocationParts = Pick<Location, 'origin' | 'pathname' | 'search' | 'hash'>
const isEditorMode = oneOfValues('editor')

function createBaseUrl(
  location: Pick<Location, 'origin' | 'pathname'>
): string {
  return `${location.origin}${location.pathname}`
}

function isCanonicalExampleState(state: ShareStateV1): state is ShareStateV1 & {
  e: string
} {
  return (
    isString(state.e) &&
    state.e.length > 0 &&
    isUndefined(state.c) &&
    isUndefined(state.i) &&
    (isUndefined(state.m) || isEditorMode(state.m)) &&
    isUndefined(state.p)
  )
}

export function canonicalizeShareState(
  state: ShareStateV1,
  examples: ShareableExample[]
): ShareStateV1 {
  if (isUndefined(state.c)) return state

  const matchingExample = examples.find(
    (example) => example.sourceCode === state.c
  )

  if (!matchingExample) return state

  return {
    ...state,
    e: matchingExample.id,
    c: undefined,
  }
}

export async function createShareUrl(
  state: ShareStateV1,
  location: Pick<Location, 'origin' | 'pathname'>,
  examples: ShareableExample[],
  options: ShareUrlOptions = {}
): Promise<ShareUrlResult> {
  const canonicalState = canonicalizeShareState(state, examples)
  const baseUrl = createBaseUrl(location)

  if (options.format !== 'token' && isCanonicalExampleState(canonicalState)) {
    return {
      success: true,
      url: `${baseUrl}?example=${encodeURIComponent(canonicalState.e)}`,
    }
  }

  const encoded = await encodeShareState(canonicalState)
  const url = `${baseUrl}#s=${encoded}`

  if (url.length > SHARE_URL_MAX_LENGTH) {
    return { success: false, reason: 'too-large' }
  }

  return {
    success: true,
    url,
    warning: url.length > SHARE_URL_WARNING_LENGTH ? 'long-url' : undefined,
  }
}

export function readExampleFromUrl(
  location: Pick<Location, 'search'>,
  examples: ShareableExample[]
): ShareableExample | null {
  const exampleId = new URLSearchParams(location.search).get('example')
  if (!exampleId) return null

  return examples.find((example) => example.id === exampleId) ?? null
}

export async function readShareStateFromUrl(
  location: Pick<Location, 'hash'>
): Promise<ShareStateDecodeResult | null> {
  const hash = location.hash.startsWith('#')
    ? location.hash.slice(1)
    : location.hash
  const params = new URLSearchParams(hash)
  const encoded = params.get('s')

  return encoded ? decodeShareState(encoded) : null
}

export function hasShareStateInUrl(location: LocationParts): boolean {
  const hash = location.hash.startsWith('#')
    ? location.hash.slice(1)
    : location.hash
  return new URLSearchParams(hash).has('s')
}
