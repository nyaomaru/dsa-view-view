import {
  isBigInt,
  isInfiniteNumber,
  isMap,
  isNaN,
  isNumberPrimitive,
  isObject,
  isSet,
  isString,
  isUndefined,
} from './guards'

type SerializedAttempt = {
  hasMarkerCollision: boolean
  serialized?: string
  tokens: Map<string, string>
}

function getNonJsonToken(value: unknown): string | undefined {
  if (isNaN(value)) return 'NaN'
  if (isInfiniteNumber(value)) return value > 0 ? 'Infinity' : '-Infinity'
  if (isNumberPrimitive(value) && Object.is(value, -0)) return '-0'

  if (isBigInt(value)) return `${value}n`
  if (isUndefined(value)) return 'undefined'

  return undefined
}

function serializeWithMarker(
  value: unknown,
  space: number | undefined,
  markerPrefix: string
): SerializedAttempt {
  const seen = new WeakSet<object>()
  const tokens = new Map<string, string>()
  let hasMarkerCollision = false

  const serialized = JSON.stringify(
    value,
    (key, item) => {
      if (key.startsWith(markerPrefix)) hasMarkerCollision = true
      if (isString(item) && item.startsWith(markerPrefix)) {
        hasMarkerCollision = true
      }

      const token = getNonJsonToken(item)
      if (!isUndefined(token)) {
        const marker = `${markerPrefix}${tokens.size}`
        tokens.set(JSON.stringify(marker), token)
        return marker
      }

      if (isObject(item)) {
        if (seen.has(item)) {
          return '[Circular]'
        }

        seen.add(item)

        if (isMap(item)) {
          return {
            type: 'Map',
            entries: Array.from(item.entries()),
          }
        }

        if (isSet(item)) {
          return {
            type: 'Set',
            values: Array.from(item.values()),
          }
        }
      }

      return item
    },
    space
  )

  return { hasMarkerCollision, serialized, tokens }
}

/**
 * Serializes a value without throwing on circular or unsupported structures.
 *
 * @param value Runtime value to serialize.
 * @param space Optional JSON indentation width.
 * @returns JSON when possible, otherwise the value's string representation.
 */
export function safeStringify(value: unknown, space?: number): string {
  try {
    let markerPrefix = '\u0000dsa-view-view-non-json:'

    while (true) {
      const attempt = serializeWithMarker(value, space, markerPrefix)
      if (attempt.hasMarkerCollision) {
        markerPrefix += '_'
        continue
      }

      let serialized = attempt.serialized ?? String(value)
      attempt.tokens.forEach((token, marker) => {
        serialized = serialized.replaceAll(marker, token)
      })
      return serialized
    }
  } catch {
    return String(value)
  }
}
