import { isArray, isFunction, isInstanceOf, isObject } from './guards'

const isIntlCollator = isInstanceOf(
  Intl.Collator as unknown as abstract new (...args: unknown[]) => Intl.Collator
)

function cloneWithoutStructuredClone<T>(
  value: T,
  seen = new WeakMap<object, unknown>()
): T {
  if (!isObject(value)) return value

  if (isInstanceOf(Date)(value)) {
    return new Date(value.getTime()) as T
  }

  if (isArray(value)) {
    if (seen.has(value)) return seen.get(value) as T

    const clone: unknown[] = []
    seen.set(value, clone)
    value.forEach((item, index) => {
      clone[index] = cloneWithoutStructuredClone(item, seen)
    })
    return clone as T
  }

  if (isIntlCollator(value)) return value
  if (seen.has(value)) return seen.get(value) as T

  const clone: Record<string, unknown> = {}
  seen.set(value, clone)
  Object.entries(value).forEach(([key, item]) => {
    clone[key] = cloneWithoutStructuredClone(item, seen)
  })

  return clone as T
}

/**
 * Deep-clones a snapshot while preserving cycles and non-serializable values.
 *
 * @param value Value to clone.
 * @returns An isolated clone when possible, or the original as a safe fallback.
 */
export function deepClone<T>(value: T): T {
  if (!isObject(value)) return value

  if (isInstanceOf(Date)(value)) {
    return new Date(value.getTime()) as T
  }

  if (isArray(value)) {
    return value.map((item) => deepClone(item)) as T
  }

  if (isIntlCollator(value)) return value

  if (isFunction(globalThis.structuredClone)) {
    try {
      return structuredClone(value)
    } catch {
      // Fall back for values that structuredClone does not support.
    }
  }

  try {
    return cloneWithoutStructuredClone(value)
  } catch {
    return value
  }
}
