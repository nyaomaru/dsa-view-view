import type {
  ExecutionState,
  HeapSnapshot,
  HeapTraceSnapshot,
} from '@/entities/execution'
import { isUndefined } from '@/shared/lib/guards'

export type HeapTraceAction = {
  /** Human-readable transition from the previous heap snapshot. */
  description: string
  /** Value added to or moved between heaps. */
  value?: number
  /** Heap receiving the highlighted value. */
  targetHeapName?: string
}

export type HeapVisualizationState = {
  /** Heap state active at the selected execution step. */
  snapshot: HeapTraceSnapshot
  /** Transition that produced this snapshot. */
  action: HeapTraceAction | null
  /** Median implied by the current pair of heaps. */
  median: number | null
}

function findHeapSnapshotAtOrBefore(
  executionState: ExecutionState,
  startIndex: number
): { index: number; snapshot: HeapTraceSnapshot } | null {
  for (let index = startIndex; index >= 0; index -= 1) {
    const snapshot = executionState.steps[index]?.metadata?.heapTrace
    if (snapshot) return { index, snapshot }
  }

  return null
}

function getValueCount(values: number[], target: number): number {
  return values.filter((value) => value === target).length
}

function getChangedValues(
  previous: HeapSnapshot | undefined,
  current: HeapSnapshot | undefined
): { added: number[]; removed: number[] } {
  const previousValues = previous?.values ?? []
  const currentValues = current?.values ?? []
  const values = new Set([...previousValues, ...currentValues])
  const added: number[] = []
  const removed: number[] = []

  values.forEach((value) => {
    const difference =
      getValueCount(currentValues, value) - getValueCount(previousValues, value)

    for (let count = 0; count < Math.abs(difference); count += 1) {
      if (difference > 0) added.push(value)
      if (difference < 0) removed.push(value)
    }
  })

  return { added, removed }
}

function getHeapTraceAction(
  previous: HeapTraceSnapshot | undefined,
  current: HeapTraceSnapshot
): HeapTraceAction | null {
  if (!previous) return null

  const changes = current.heaps.map((heap) => ({
    heap,
    ...getChangedValues(
      previous.heaps.find((candidate) => candidate.name === heap.name),
      heap
    ),
  }))
  const removedChange = changes.find((change) => change.removed.length > 0)
  const addedChange = changes.find((change) => change.added.length > 0)
  const movedValue = removedChange?.removed.find((value) =>
    addedChange?.added.includes(value)
  )

  if (removedChange && addedChange && !isUndefined(movedValue)) {
    return {
      description: `Moved ${movedValue}: ${removedChange.heap.name} → ${addedChange.heap.name}`,
      value: movedValue,
      targetHeapName: addedChange.heap.name,
    }
  }

  if (addedChange) {
    const value = addedChange.added[0]
    return {
      description: `Pushed ${value} into ${addedChange.heap.name}`,
      value,
      targetHeapName: addedChange.heap.name,
    }
  }

  if (removedChange) {
    const value = removedChange.removed[0]
    return {
      description: `Popped ${value} from ${removedChange.heap.name}`,
      value,
    }
  }

  return null
}

function getMedian(snapshot: HeapTraceSnapshot): number | null {
  const minHeap = snapshot.heaps.find((heap) => heap.kind === 'min')
  const maxHeap = snapshot.heaps.find((heap) => heap.kind === 'max')
  const minTop = minHeap?.values[0]
  const maxTop = maxHeap?.values[0]
  const minSize = minHeap?.values.length ?? 0
  const maxSize = maxHeap?.values.length ?? 0

  if (isUndefined(minTop) && isUndefined(maxTop)) return null
  if (isUndefined(minTop)) return maxTop ?? null
  if (isUndefined(maxTop)) return minTop
  if (minSize > maxSize) return minTop
  if (maxSize > minSize) return maxTop
  return (minTop + maxTop) / 2
}

/** Resolves the prepared heap pair active at the selected timeline step. */
export function getHeapVisualizationState(
  executionState: ExecutionState
): HeapVisualizationState | null {
  const current = findHeapSnapshotAtOrBefore(
    executionState,
    executionState.currentStep
  )
  if (!current) return null

  const previous = findHeapSnapshotAtOrBefore(executionState, current.index - 1)

  return {
    snapshot: current.snapshot,
    action: getHeapTraceAction(previous?.snapshot, current.snapshot),
    median: getMedian(current.snapshot),
  }
}
