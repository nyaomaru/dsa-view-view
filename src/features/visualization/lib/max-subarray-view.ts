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

function numericArrayEquals(value: unknown, expected: number[]): boolean {
  return (
    isNumericArray(value) &&
    value.length === expected.length &&
    value.every((entry, index) => Number(entry) === expected[index])
  )
}

function getInitialNumericArrays(
  executionState: ExecutionState
): Array<[string, number[]]> {
  const initialStep = executionState.steps.find(
    (step) => Object.keys(step.variables).length > 0
  )
  if (!initialStep) return []

  return Object.entries(initialStep.variables).flatMap(([name, value]) =>
    isNumericArray(value) && value.length >= 2
      ? [[name, value.map(Number)] as [string, number[]]]
      : []
  )
}

function getNumericVariableNames(executionState: ExecutionState): string[] {
  const names = new Set<string>()

  for (const step of executionState.steps) {
    for (const [name, value] of Object.entries(step.variables)) {
      if (isNumber(value)) names.add(name)
    }
  }

  return [...names]
}

function appearsWithEveryLoopIndex({
  executionState,
  arrayName,
  data,
  variableName,
}: {
  executionState: ExecutionState
  arrayName: string
  data: number[]
  variableName: string
}): boolean {
  return data.slice(1).every((_, indexOffset) => {
    const expectedIndex = indexOffset + 1

    return executionState.steps.some(
      (step) =>
        numericArrayEquals(step.variables[arrayName], data) &&
        step.variables[variableName] === expectedIndex
    )
  })
}

function isInitializedFromFirstValue({
  executionState,
  arrayName,
  data,
  variableName,
}: {
  executionState: ExecutionState
  arrayName: string
  data: number[]
  variableName: string
}): boolean {
  return executionState.steps.some(
    (step) =>
      numericArrayEquals(step.variables[arrayName], data) &&
      step.variables[variableName] === data[0]
  )
}

function findInitialStateStep({
  executionState,
  data,
  arrayName,
  endingName,
  bestName,
  beforeStepIndex,
}: {
  executionState: ExecutionState
  data: number[]
  arrayName: string
  endingName: string
  bestName: string
  beforeStepIndex: number
}): number | undefined {
  return executionState.steps.findIndex((step, stepIndex) => {
    if (stepIndex > beforeStepIndex) return false

    return (
      numericArrayEquals(step.variables[arrayName], data) &&
      step.variables[endingName] === data[0] &&
      step.variables[bestName] === data[0]
    )
  })
}

function findKadaneMapping({
  executionState,
  arrayName,
  data,
  indexName,
  endingName,
  bestName,
}: {
  executionState: ExecutionState
  arrayName: string
  data: number[]
  indexName: string
  endingName: string
  bestName: string
}): MaxSubarrayTraceCandidate | undefined {
  let previousEnding = data[0]
  let previousBest = data[0]
  let previousStepIndex = -1
  let firstUpdateStepIndex: number | undefined

  for (let index = 1; index < data.length; index++) {
    const expectedEnding = Math.max(data[index], previousEnding + data[index])
    const expectedBest = Math.max(previousBest, expectedEnding)
    const stepIndex = executionState.steps.findIndex((step, candidateIndex) => {
      if (candidateIndex <= previousStepIndex) return false

      return (
        numericArrayEquals(step.variables[arrayName], data) &&
        step.variables[indexName] === index &&
        step.variables[endingName] === expectedEnding &&
        step.variables[bestName] === expectedBest
      )
    })

    if (stepIndex < 0) return undefined

    firstUpdateStepIndex ??= stepIndex
    previousStepIndex = stepIndex
    previousEnding = expectedEnding
    previousBest = expectedBest
  }

  if (isUndefined(firstUpdateStepIndex)) return undefined

  const initialStateStepIndex = findInitialStateStep({
    executionState,
    data,
    arrayName,
    endingName,
    bestName,
    beforeStepIndex: firstUpdateStepIndex,
  })

  return {
    name: arrayName,
    stepIndex:
      !isUndefined(initialStateStepIndex) && initialStateStepIndex >= 0
        ? initialStateStepIndex
        : firstUpdateStepIndex,
    indexName,
    endingName,
    bestName,
  }
}

/**
 * Detects Kadane's algorithm from its value transitions instead of requiring
 * exact variable names such as `i`, `maxEndingHere`, and `maxSoFar`.
 */
export function getMaxSubarrayTraceCandidate(
  executionState: ExecutionState
): MaxSubarrayTraceCandidate | undefined {
  const numericNames = getNumericVariableNames(executionState)

  for (const [arrayName, data] of getInitialNumericArrays(executionState)) {
    const indexNames = numericNames.filter((variableName) =>
      appearsWithEveryLoopIndex({
        executionState,
        arrayName,
        data,
        variableName,
      })
    )
    const accumulatorNames = numericNames.filter((variableName) =>
      isInitializedFromFirstValue({
        executionState,
        arrayName,
        data,
        variableName,
      })
    )

    for (const indexName of indexNames) {
      for (const endingName of accumulatorNames) {
        if (endingName === indexName) continue

        for (const bestName of accumulatorNames) {
          if (bestName === indexName || bestName === endingName) continue

          const candidate = findKadaneMapping({
            executionState,
            arrayName,
            data,
            indexName,
            endingName,
            bestName,
          })
          if (candidate) return candidate
        }
      }
    }
  }

  return undefined
}

function readVisualizationState({
  executionState,
  stepIndex,
  candidate,
  data,
}: {
  executionState: ExecutionState
  stepIndex: number
  candidate: MaxSubarrayTraceCandidate
  data: number[]
}): MaxSubarrayVisualizationState | undefined {
  const variables = executionState.steps[stepIndex]?.variables
  if (!variables) return undefined
  if (!numericArrayEquals(variables[candidate.name], data)) return undefined

  const maxEndingHere = variables[candidate.endingName]
  const maxSoFar = variables[candidate.bestName]
  if (!isNumber(maxEndingHere) || !isNumber(maxSoFar)) return undefined

  const recordedIndex = variables[candidate.indexName]
  const isRecordedIndexInBounds =
    isInteger(recordedIndex) &&
    recordedIndex >= 0 &&
    recordedIndex < data.length
  const isInitialState = maxEndingHere === data[0] && maxSoFar === data[0]
  let expectedEnding = data[0]
  let expectedBest = data[0]

  if (isRecordedIndexInBounds) {
    for (let index = 1; index <= recordedIndex; index++) {
      expectedEnding = Math.max(data[index], expectedEnding + data[index])
      expectedBest = Math.max(expectedBest, expectedEnding)
    }
  }

  const matchesRecordedIndex =
    isRecordedIndexInBounds &&
    maxEndingHere === expectedEnding &&
    maxSoFar === expectedBest
  const currentIndex = matchesRecordedIndex
    ? recordedIndex
    : isInitialState
      ? 0
      : undefined

  if (isUndefined(currentIndex)) return undefined

  return {
    data,
    currentIndex,
    currentValue: data[currentIndex],
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
  const candidate = getMaxSubarrayTraceCandidate(executionState)
  if (!candidate || candidate.name !== variableName) return undefined

  const data = getInitialNumericArrays(executionState).find(
    ([name]) => name === variableName
  )?.[1]
  if (!data) return undefined

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
      executionState,
      stepIndex,
      candidate,
      data,
    })
    if (state) return state
  }

  return undefined
}
