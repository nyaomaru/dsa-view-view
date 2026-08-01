import type { HeapKind, HeapTraceSnapshot } from '@/entities/execution'
import {
  arrayOf,
  define,
  hasKeys,
  isFunction,
  isNonArrayObject,
  isNumber,
  isString,
  isUndefined,
  oneOfValues,
} from '@/shared/lib/guards'

const PREPARED_HEAP_KIND_LABEL = '__algorithmVisualizerHeapKind'
const isPreparedHeapKind = oneOfValues('min', 'max')
const isLocalMinHeapClassName = define<string>(
  (value) => isString(value) && /^MinHeap(?:$|[A-Z0-9_])/.test(value)
)
const isLocalMaxHeapClassName = define<string>(
  (value) => isString(value) && /^MaxHeap(?:$|[A-Z0-9_])/.test(value)
)
const isHeapStorageName = oneOfValues('heap', 'values')
const isNumberArray = arrayOf(isNumber)
const isSummedHeapItem = define<{ sum: number }>(
  (value) =>
    isNonArrayObject(value) && hasKeys('sum')(value) && isNumber(value.sum)
)
const isSummedHeapItemArray = arrayOf(isSummedHeapItem)
const hasPreparedHeapKeys = hasKeys(PREPARED_HEAP_KIND_LABEL, 'values')
const hasPreparedHeapKind = hasKeys(PREPARED_HEAP_KIND_LABEL)

type RegisteredHeap = {
  instance: Record<PropertyKey, unknown>
  name: string
  kind: HeapKind
}

/** Captures normalized heap snapshots while retaining class ownership groups. */
export type HeapTraceCollector = {
  capture: (receiver: unknown) => HeapTraceSnapshot | undefined
}

function getHeapKind(
  value: Record<PropertyKey, unknown>
): HeapKind | undefined {
  if (
    hasPreparedHeapKind(value) &&
    isPreparedHeapKind(value[PREPARED_HEAP_KIND_LABEL])
  ) {
    return value[PREPARED_HEAP_KIND_LABEL]
  }

  if (!isFunction(value.constructor)) return undefined

  const className = value.constructor.name
  if (isLocalMinHeapClassName(className)) return 'min'
  if (isLocalMaxHeapClassName(className)) return 'max'
  return undefined
}

function normalizeHeapValues(value: unknown): number[] | undefined {
  if (isNumberArray(value)) return [...value]
  if (isSummedHeapItemArray(value)) {
    return value.map((item) => item.sum)
  }

  return undefined
}

function getHeapValues(
  value: Record<PropertyKey, unknown>
): number[] | undefined {
  if (hasPreparedHeapKeys(value)) {
    const preparedValues = normalizeHeapValues(value.values)
    if (preparedValues) return preparedValues
  }

  const heapArrays = Object.entries(value).flatMap(([name, candidate]) => {
    const values = normalizeHeapValues(candidate)
    return values ? [[name, values] as const] : []
  })
  const storage =
    heapArrays.find(([name]) => isHeapStorageName(name)) ??
    (heapArrays.length === 1 ? heapArrays[0] : undefined)

  return storage ? storage[1] : undefined
}

function getDefaultHeapName(kind: HeapKind): string {
  return kind === 'min' ? 'minHeap' : 'maxHeap'
}

function getRegisteredHeap(
  instance: Record<PropertyKey, unknown>,
  name: string
): RegisteredHeap | undefined {
  const kind = getHeapKind(instance)
  const values = getHeapValues(instance)
  if (isUndefined(kind) || isUndefined(values)) return undefined

  return { instance, name, kind }
}

function createHeapTraceSnapshot(
  heaps: RegisteredHeap[]
): HeapTraceSnapshot | undefined {
  const snapshots = heaps.flatMap(({ instance, name, kind }) => {
    const values = getHeapValues(instance)
    return isUndefined(values) ? [] : [{ name, kind, values }]
  })

  return snapshots.length > 0 ? { heaps: snapshots } : undefined
}

/** Creates an execution-scoped collector for prepared and local heaps. */
export function createHeapTraceCollector(): HeapTraceCollector {
  const heapGroups = new WeakMap<object, RegisteredHeap[]>()

  return {
    capture(receiver) {
      if (!isNonArrayObject(receiver)) return undefined

      const ownedHeaps = Object.entries(receiver).flatMap(([name, value]) => {
        if (!isNonArrayObject(value)) return []

        const heap = getRegisteredHeap(value, name)
        return isUndefined(heap) ? [] : [heap]
      })

      if (ownedHeaps.length > 0) {
        ownedHeaps.forEach(({ instance }) => {
          heapGroups.set(instance, ownedHeaps)
        })
        return createHeapTraceSnapshot(ownedHeaps)
      }

      const receiverKind = getHeapKind(receiver)
      if (isUndefined(receiverKind) || isUndefined(getHeapValues(receiver))) {
        return undefined
      }

      const registeredHeaps = heapGroups.get(receiver)
      if (registeredHeaps) return createHeapTraceSnapshot(registeredHeaps)

      const receiverHeap: RegisteredHeap = {
        instance: receiver,
        name: getDefaultHeapName(receiverKind),
        kind: receiverKind,
      }
      const receiverGroup = [receiverHeap]
      heapGroups.set(receiver, receiverGroup)
      return createHeapTraceSnapshot(receiverGroup)
    },
  }
}
