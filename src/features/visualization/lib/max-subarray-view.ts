import type { ExecutionState } from '@/entities/execution'
import {
  isInteger,
  isNumber,
  isNumericArray,
  isUndefined,
} from '@/shared/lib/guards'
import { getExecutionStepSearchOrder } from './execution-step-search'

/** Variable mapping inferred from a Kadane maximum-subarray trace. */
export type MaxSubarrayTraceCandidate = {
  /** Numeric source-array variable. */
  name: string
  /** First step where both running values represent the first element. */
  stepIndex: number
  /** Loop-index variable. */
  indexName: string
  /** Variable holding the best sum ending at the current position. */
  endingName: string
  /** Variable holding the best sum seen so far. */
  bestName: string
}

/** Values displayed by the maximum-subarray visualization. */
export type MaxSubarrayVisualizationState = {
  /** Numeric source array. */
  data: number[]
  /** Current array position. */
  currentIndex: number
  /** Value at the current position. */
  currentValue: number
  /** Best subarray sum ending at the current position. */
  maxEndingHere: number
  /** Best subarray sum observed through the current position. */
  maxSoFar: number
  /** Runtime variable names shown alongside their semantic labels. */
  variableNames: Pick<
    MaxSubarrayTraceCandidate,
    'indexName' | 'endingName' | 'bestName'
  >
}

type ExpectedKadaneState = {
  ending: number
  best: number
}

type NumericTraceSnapshot = {
  stepIndex: number
  values: Map<string, number>
}

type IndexedSourceTrace = {
  name: string
  data: number[]
  expectedStates: ExpectedKadaneState[]
  snapshots: NumericTraceSnapshot[]
  snapshotByStepIndex: Map<number, NumericTraceSnapshot>
  valueSetByName: Map<string, Set<number>>
}

type MaxSubarrayTraceAnalysis = {
  candidate: MaxSubarrayTraceCandidate | undefined
  sourceByName: Map<string, IndexedSourceTrace>
}

const traceAnalysisCache = new WeakMap<
  ExecutionState['steps'],
  MaxSubarrayTraceAnalysis
>()

function numericArrayEquals(value: unknown, expected: number[]): boolean {
  return (
    isNumericArray(value) &&
    value.length === expected.length &&
    value.every((entry, index) => Number(entry) === expected[index])
  )
}

function getInitialNumericArrays(
  steps: ExecutionState['steps']
): Array<[string, number[]]> {
  const initialStep = steps.find(
    (step) => Object.keys(step.variables).length > 0
  )
  if (!initialStep) return []

  return Object.entries(initialStep.variables).flatMap(([name, value]) =>
    isNumericArray(value) && value.length >= 2
      ? [[name, value.map(Number)] as [string, number[]]]
      : []
  )
}

function getExpectedStates(data: number[]): ExpectedKadaneState[] {
  let ending = data[0]
  let best = data[0]

  return data.map((value, index) => {
    if (index > 0) {
      ending = Math.max(value, ending + value)
      best = Math.max(best, ending)
    }

    return { ending, best }
  })
}

function indexSourceTrace(
  steps: ExecutionState['steps'],
  name: string,
  data: number[]
): IndexedSourceTrace {
  const snapshots: NumericTraceSnapshot[] = []
  const snapshotByStepIndex = new Map<number, NumericTraceSnapshot>()
  const valueSetByName = new Map<string, Set<number>>()

  steps.forEach((step, stepIndex) => {
    if (!numericArrayEquals(step.variables[name], data)) return

    const values = new Map<string, number>()
    for (const [variableName, value] of Object.entries(step.variables)) {
      if (!isNumber(value)) continue

      values.set(variableName, value)
      const observedValues = valueSetByName.get(variableName) ?? new Set()
      observedValues.add(value)
      valueSetByName.set(variableName, observedValues)
    }

    const snapshot = { stepIndex, values }
    snapshots.push(snapshot)
    snapshotByStepIndex.set(stepIndex, snapshot)
  })

  return {
    name,
    data,
    expectedStates: getExpectedStates(data),
    snapshots,
    snapshotByStepIndex,
    valueSetByName,
  }
}

function includesEveryLoopIndex(
  observedValues: Set<number>,
  dataLength: number
): boolean {
  for (let index = 1; index < dataLength; index++) {
    if (!observedValues.has(index)) return false
  }

  return true
}

function groupSnapshotsByIndex(
  source: IndexedSourceTrace,
  indexName: string
): Map<number, NumericTraceSnapshot[]> {
  const snapshotsByIndex = new Map<number, NumericTraceSnapshot[]>()

  for (const snapshot of source.snapshots) {
    const index = snapshot.values.get(indexName)
    if (!isInteger(index) || index < 1 || index >= source.data.length) continue

    const snapshots = snapshotsByIndex.get(index) ?? []
    snapshots.push(snapshot)
    snapshotsByIndex.set(index, snapshots)
  }

  return snapshotsByIndex
}

function findFirstMatchingUpdateStep({
  source,
  snapshotsByIndex,
  endingName,
  bestName,
}: {
  source: IndexedSourceTrace
  snapshotsByIndex: Map<number, NumericTraceSnapshot[]>
  endingName: string
  bestName: string
}): number | undefined {
  let firstUpdateStepIndex: number | undefined
  let previousStepIndex = -1

  for (let index = 1; index < source.data.length; index++) {
    const expectedState = source.expectedStates[index]
    const matchingSnapshot = snapshotsByIndex
      .get(index)
      ?.find(
        (snapshot) =>
          snapshot.stepIndex > previousStepIndex &&
          snapshot.values.get(endingName) === expectedState.ending &&
          snapshot.values.get(bestName) === expectedState.best
      )
    if (!matchingSnapshot) return undefined

    firstUpdateStepIndex ??= matchingSnapshot.stepIndex
    previousStepIndex = matchingSnapshot.stepIndex
  }

  return firstUpdateStepIndex
}

function findInitialStateStep({
  source,
  endingName,
  bestName,
  beforeStepIndex,
}: {
  source: IndexedSourceTrace
  endingName: string
  bestName: string
  beforeStepIndex: number
}): number | undefined {
  return source.snapshots.find(
    (snapshot) =>
      snapshot.stepIndex <= beforeStepIndex &&
      snapshot.values.get(endingName) === source.expectedStates[0].ending &&
      snapshot.values.get(bestName) === source.expectedStates[0].best
  )?.stepIndex
}

function findCandidateForSource(
  source: IndexedSourceTrace
): MaxSubarrayTraceCandidate | undefined {
  const indexNames = [...source.valueSetByName.entries()]
    .filter(([, values]) => includesEveryLoopIndex(values, source.data.length))
    .map(([name]) => name)
  const accumulatorNames = [...source.valueSetByName.entries()]
    .filter(([, values]) => values.has(source.data[0]))
    .map(([name]) => name)

  for (const indexName of indexNames) {
    const snapshotsByIndex = groupSnapshotsByIndex(source, indexName)

    for (const endingName of accumulatorNames) {
      if (endingName === indexName) continue

      for (const bestName of accumulatorNames) {
        if (bestName === indexName || bestName === endingName) continue

        const firstUpdateStepIndex = findFirstMatchingUpdateStep({
          source,
          snapshotsByIndex,
          endingName,
          bestName,
        })
        if (isUndefined(firstUpdateStepIndex)) continue
        const initialStateStepIndex = findInitialStateStep({
          source,
          endingName,
          bestName,
          beforeStepIndex: firstUpdateStepIndex,
        })

        return {
          name: source.name,
          stepIndex: initialStateStepIndex ?? firstUpdateStepIndex,
          indexName,
          endingName,
          bestName,
        }
      }
    }
  }

  return undefined
}

function analyzeTrace(
  steps: ExecutionState['steps']
): MaxSubarrayTraceAnalysis {
  const cachedAnalysis = traceAnalysisCache.get(steps)
  if (cachedAnalysis) return cachedAnalysis

  const sourceByName = new Map<string, IndexedSourceTrace>()
  let candidate: MaxSubarrayTraceCandidate | undefined

  for (const [name, data] of getInitialNumericArrays(steps)) {
    const source = indexSourceTrace(steps, name, data)
    sourceByName.set(name, source)
    candidate = findCandidateForSource(source)
    if (candidate) break
  }

  const analysis = { candidate, sourceByName }
  traceAnalysisCache.set(steps, analysis)
  return analysis
}

/**
 * Detects Kadane's algorithm from its value transitions instead of requiring
 * exact variable names such as `i`, `maxEndingHere`, and `maxSoFar`.
 */
export function getMaxSubarrayTraceCandidate(
  executionState: ExecutionState
): MaxSubarrayTraceCandidate | undefined {
  return analyzeTrace(executionState.steps).candidate
}

function readVisualizationState({
  stepIndex,
  candidate,
  source,
}: {
  stepIndex: number
  candidate: MaxSubarrayTraceCandidate
  source: IndexedSourceTrace
}): MaxSubarrayVisualizationState | undefined {
  const snapshot = source.snapshotByStepIndex.get(stepIndex)
  if (!snapshot) return undefined

  const maxEndingHere = snapshot.values.get(candidate.endingName)
  const maxSoFar = snapshot.values.get(candidate.bestName)
  if (isUndefined(maxEndingHere) || isUndefined(maxSoFar)) return undefined

  const recordedIndex = snapshot.values.get(candidate.indexName)
  const isRecordedIndexInBounds =
    isInteger(recordedIndex) &&
    recordedIndex >= 0 &&
    recordedIndex < source.data.length
  const expectedState = isRecordedIndexInBounds
    ? source.expectedStates[recordedIndex]
    : undefined
  const matchesRecordedIndex =
    isRecordedIndexInBounds &&
    maxEndingHere === expectedState?.ending &&
    maxSoFar === expectedState.best
  const initialState = source.expectedStates[0]
  const isInitialState =
    maxEndingHere === initialState.ending && maxSoFar === initialState.best
  const currentIndex = matchesRecordedIndex
    ? recordedIndex
    : isInitialState
      ? 0
      : undefined

  if (isUndefined(currentIndex)) return undefined

  return {
    data: source.data,
    currentIndex,
    currentValue: source.data[currentIndex],
    maxEndingHere,
    maxSoFar,
    variableNames: {
      indexName: candidate.indexName,
      endingName: candidate.endingName,
      bestName: candidate.bestName,
    },
  }
}

/** Resolves the closest usable maximum-subarray state for the selected step. */
export function getMaxSubarrayVisualizationState({
  executionState,
  variableName,
  targetStepIndex,
}: {
  executionState: ExecutionState
  variableName: string
  targetStepIndex?: number
}): MaxSubarrayVisualizationState | undefined {
  const analysis = analyzeTrace(executionState.steps)
  const { candidate } = analysis
  if (!candidate || candidate.name !== variableName) return undefined

  const source = analysis.sourceByName.get(variableName)
  if (!source) return undefined

  const currentAndPastStepIndexes = getExecutionStepSearchOrder({
    executionState,
    preferPastSteps: true,
    includeFutureSteps: false,
  })
  const fallbackStepIndexes = getExecutionStepSearchOrder({
    executionState,
    targetStepIndex,
    preferPastSteps: true,
  })
  const orderedStepIndexes = new Set([
    ...currentAndPastStepIndexes,
    ...fallbackStepIndexes,
  ])

  for (const stepIndex of orderedStepIndexes) {
    const state = readVisualizationState({
      stepIndex,
      candidate,
      source,
    })
    if (state) return state
  }

  return undefined
}
