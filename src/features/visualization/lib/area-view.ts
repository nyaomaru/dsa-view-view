import {
  isInteger,
  isNull,
  isNumber,
  isNumericArray,
  isUndefined,
} from '@/shared/lib/guards'
import type { ExecutionState } from '@/entities/execution'

/** Pointer-derived area metrics for a two-pointer execution step. */
export type AreaPointerState = {
  /** Left pointer index. */
  leftIndex: number
  /** Right pointer index. */
  rightIndex: number
  /** Limiting height between both pointers. */
  currentHeight: number
  /** Distance between both pointers. */
  width: number
  /** Area produced by the current pointers. */
  currentArea: number
  /** Optional best area recorded by the algorithm. */
  bestArea?: number
}

/** Data and pointer metrics required by the area visualization. */
export type AreaVisualizationState = {
  /** Numeric source array. */
  data: number[]
  /** Pointer metrics for the displayed execution step. */
  areaState: AreaPointerState
}

function readIntegerVariable(
  variables: Record<string, unknown>,
  names: string[]
): number | null {
  for (const name of names) {
    const value = variables[name]

    if (isInteger(value)) {
      return value
    }
  }

  return null
}

function readNumberVariable(
  variables: Record<string, unknown>,
  names: string[]
): number | undefined {
  for (const name of names) {
    const value = variables[name]

    if (isNumber(value)) {
      return value
    }
  }

  return undefined
}

/**
 * Derives valid two-pointer area metrics from source data and variables.
 *
 * @param data Numeric height values.
 * @param variables Variables captured for one execution step.
 * @returns Pointer metrics, or `null` when indexes are missing or invalid.
 */
export function getAreaPointerState(
  data: number[],
  variables: Record<string, unknown>
): AreaPointerState | null {
  const leftIndex = readIntegerVariable(variables, ['l', 'left'])
  const rightIndex = readIntegerVariable(variables, ['r', 'right'])

  if (
    isNull(leftIndex) ||
    isNull(rightIndex) ||
    leftIndex < 0 ||
    rightIndex < 0 ||
    leftIndex >= data.length ||
    rightIndex >= data.length ||
    leftIndex >= rightIndex
  ) {
    return null
  }

  const width = rightIndex - leftIndex
  const currentHeight = Math.min(data[leftIndex], data[rightIndex])

  return {
    leftIndex,
    rightIndex,
    currentHeight,
    width,
    currentArea: currentHeight * width,
    bestArea: readNumberVariable(variables, ['best', 'maxArea', 'max']),
  }
}

/**
 * Finds the highest-area pointer state through a target execution step.
 *
 * @param executionState Complete algorithm execution state.
 * @param variableName Name of the numeric height array.
 * @param targetStepIndex Optional final step to inspect.
 * @returns Best pointer state found, or `null` when none is valid.
 */
export function getBestAreaPointerState(
  executionState: ExecutionState,
  variableName: string,
  targetStepIndex?: number
): AreaPointerState | null {
  const endStepIndex = Math.min(
    targetStepIndex ?? executionState.currentStep,
    executionState.steps.length - 1
  )
  let bestState: AreaPointerState | null = null

  for (let index = 0; index <= endStepIndex; index += 1) {
    const step = executionState.steps[index]
    const data = step?.variables[variableName]

    if (!isNumericArray(data)) continue

    const areaState = getAreaPointerState(data.map(Number), step.variables)

    if (
      !isNull(areaState) &&
      (isNull(bestState) || areaState.currentArea > bestState.currentArea)
    ) {
      bestState = areaState
    }
  }

  return bestState
}

/**
 * Resolves the data and pointer state displayed by the area visualization.
 *
 * @param options Execution state, source variable name, and optional target step.
 * @returns Visualization state, or `null` when the execution is not compatible.
 */
export function getAreaVisualizationState({
  executionState,
  variableName,
  targetStepIndex,
}: {
  executionState: ExecutionState
  variableName: string
  targetStepIndex?: number
}): AreaVisualizationState | null {
  const currentStep = executionState.steps[executionState.currentStep]
  const fallbackStep =
    executionState.steps[targetStepIndex ?? executionState.currentStep]
  const currentData = currentStep?.variables[variableName]
  const currentAreaState =
    isNumericArray(currentData) && currentStep
      ? getAreaPointerState(currentData.map(Number), currentStep.variables)
      : null
  const areaStep = currentAreaState ? currentStep : fallbackStep
  const data = areaStep?.variables[variableName]

  if (!isNumericArray(data)) return null

  const numericData = data.map(Number)
  const shouldUseBestAreaState =
    executionState.isComplete || currentStep?.type === 'return'
  const areaState = shouldUseBestAreaState
    ? getBestAreaPointerState(
        executionState,
        variableName,
        executionState.currentStep
      )
    : areaStep
      ? getAreaPointerState(numericData, areaStep.variables)
      : null

  return isNull(areaState) ? null : { data: numericData, areaState }
}

/**
 * Checks whether a runtime value represents a two-pointer area problem.
 *
 * @param variableName Candidate source variable name.
 * @param value Candidate runtime value.
 * @param variables Variables captured for the same execution step.
 * @returns Whether the value has compatible data, pointers, and area metadata.
 */
export function isAreaViewCandidate(
  variableName: string,
  value: unknown,
  variables: Record<string, unknown>
): boolean {
  if (!isNumericArray(value) || value.length < 2) return false
  if (variableName.toLowerCase() !== 'height') return false
  if (isUndefined(readNumberVariable(variables, ['best', 'maxArea', 'max']))) {
    return false
  }

  return !isNull(getAreaPointerState(value.map(Number), variables))
}
