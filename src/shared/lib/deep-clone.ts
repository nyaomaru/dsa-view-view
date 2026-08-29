import {
  isArray,
  isDate,
  isFunction,
  isInstanceOf,
  isMap,
  isObject,
  isRegExp,
  isSet,
} from './guards'

const isIntlCollator = isInstanceOf(
  Intl.Collator as unknown as abstract new (...args: unknown[]) => Intl.Collator
)
const mapForEach = Reflect.get(Map.prototype, 'forEach') as Map<
  unknown,
  unknown
>['forEach']
const setForEach = Reflect.get(Set.prototype, 'forEach') as Set<
  unknown
>['forEach']

function hasEnumerableAccessor(
  value: unknown,
  seen = new WeakSet<object>()
): boolean {
  if (!isObject(value) || seen.has(value)) return false
  if (isDate(value) || isRegExp(value) || isIntlCollator(value)) return false

  seen.add(value)

  if (isMap(value)) {
    let found = false
    mapForEach.call(value, (item, key) => {
      found ||=
        hasEnumerableAccessor(key, seen) ||
        hasEnumerableAccessor(item, seen)
    })
    return found
  }

  if (isSet(value)) {
    let found = false
    setForEach.call(value, (item) => {
      found ||= hasEnumerableAccessor(item, seen)
    })
    return found
  }

  return Object.values(Object.getOwnPropertyDescriptors(value)).some(
    (descriptor) =>
      descriptor.enumerable &&
      (!('value' in descriptor) ||
        hasEnumerableAccessor(descriptor.value, seen))
  )
}

function cloneEnumerableProperties(
  value: object,
  clone: Record<string, unknown>,
  seen: WeakMap<object, unknown>
): void {
  Object.entries(Object.getOwnPropertyDescriptors(value)).forEach(
    ([key, descriptor]) => {
      if (!descriptor.enumerable) return

      clone[key] =
        'value' in descriptor
          ? cloneWithoutStructuredClone(descriptor.value, seen)
          : '[Getter]'
    }
  )
}

function cloneWithoutStructuredClone<T>(
  value: T,
  seen = new WeakMap<object, unknown>()
): T {
  if (!isObject(value)) return value

  if (isDate(value)) {
    return new Date(value.getTime()) as T
  }

  if (isRegExp(value)) {
    return new RegExp(value.source, value.flags) as T
  }

  if (isArray(value)) {
    if (seen.has(value)) return seen.get(value) as T

    const clone: unknown[] = []
    seen.set(value, clone)
    cloneEnumerableProperties(
      value,
      clone as unknown as Record<string, unknown>,
      seen
    )
    return clone as T
  }

  if (isIntlCollator(value)) return value
  if (seen.has(value)) return seen.get(value) as T

  if (isMap(value)) {
    const clone = new Map<unknown, unknown>()
    seen.set(value, clone)
    mapForEach.call(value, (item, key) => {
      clone.set(
        cloneWithoutStructuredClone(key, seen),
        cloneWithoutStructuredClone(item, seen)
      )
    })
    return clone as T
  }

  if (isSet(value)) {
    const clone = new Set<unknown>()
    seen.set(value, clone)
    setForEach.call(value, (item) =>
      clone.add(cloneWithoutStructuredClone(item, seen))
    )
    return clone as T
  }

  const clone: Record<string, unknown> = {}
  seen.set(value, clone)
  cloneEnumerableProperties(value, clone, seen)

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
  if (isIntlCollator(value)) return value

  if (
    isFunction(globalThis.structuredClone) &&
    !hasEnumerableAccessor(value)
  ) {
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
