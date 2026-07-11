import { isObject } from './guards'

/**
 * Serializes a value without throwing on circular or unsupported structures.
 *
 * @param value Runtime value to serialize.
 * @param space Optional JSON indentation width.
 * @returns JSON when possible, otherwise the value's string representation.
 */
export function safeStringify(value: unknown, space?: number): string {
  const seen = new WeakSet<object>()

  try {
    const serialized = JSON.stringify(
      value,
      (_key, item) => {
        if (isObject(item)) {
          if (seen.has(item)) {
            return '[Circular]'
          }

          seen.add(item)
        }

        return item
      },
      space
    )

    return serialized ?? String(value)
  } catch {
    return String(value)
  }
}
