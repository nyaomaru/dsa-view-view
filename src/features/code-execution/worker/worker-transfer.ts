import {
  isArray,
  isFunction,
  isInstanceOf,
  isObject,
  isSymbol,
} from '@/shared/lib/guards'

const isDate = isInstanceOf(
  Date as unknown as abstract new (...args: unknown[]) => Date
)
const isMap = isInstanceOf(
  Map as unknown as abstract new (...args: unknown[]) => Map<unknown, unknown>
)
const isRegExp = isInstanceOf(
  RegExp as unknown as abstract new (...args: unknown[]) => RegExp
)
const isSet = isInstanceOf(
  Set as unknown as abstract new (...args: unknown[]) => Set<unknown>
)

function getFunctionLabel(value: Function): string {
  return value.name ? `[Function ${value.name}]` : '[Function]'
}

function cloneForWorker(
  value: unknown,
  seen: WeakMap<object, unknown>
): unknown {
  if (isFunction(value)) return getFunctionLabel(value)
  if (isSymbol(value)) return String(value)
  if (!isObject(value)) return value

  const existing = seen.get(value)
  if (existing) return existing

  if (isDate(value)) return new Date(value.getTime())
  if (isRegExp(value)) return new RegExp(value.source, value.flags)

  if (isArray(value)) {
    const clone: unknown[] = []
    clone.length = value.length
    seen.set(value, clone)
    value.forEach((item, index) => {
      clone[index] = cloneForWorker(item, seen)
    })
    return clone
  }

  if (isMap(value)) {
    const clone = new Map<unknown, unknown>()
    seen.set(value, clone)
    value.forEach((item, key) => {
      clone.set(cloneForWorker(key, seen), cloneForWorker(item, seen))
    })
    return clone
  }

  if (isSet(value)) {
    const clone = new Set<unknown>()
    seen.set(value, clone)
    value.forEach((item) => clone.add(cloneForWorker(item, seen)))
    return clone
  }

  const clone: Record<string, unknown> = {}
  seen.set(value, clone)
  Object.entries(value).forEach(([key, item]) => {
    clone[key] = cloneForWorker(item, seen)
  })
  return clone
}

/**
 * Creates a structured-clone-safe representation for a Worker response.
 * Cycles and shared references are retained while unsupported runtime values
 * such as functions and symbols are converted to readable labels.
 */
export function createWorkerTransferValue<T>(value: T): T {
  return cloneForWorker(value, new WeakMap()) as T
}
