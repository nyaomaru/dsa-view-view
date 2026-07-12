import {
  equals,
  isInteger,
  isNull,
  isNumber,
  isNumericArray,
  isUndefined,
} from '@/shared/lib/guards'
import type { ExecutionState } from '@/entities/execution'

const isHeightVariableName = equals('height')

/** Pointer-derived area metrics for a two-pointer execution step. */
export type AreaPointerState = {
  /** Container-area visualization mode. */
  mode: 'container'
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

/** Pointer and accumulated-water metrics for a rain-water execution step. */
export type RainWaterPointerState = {
  /** Trapping-rain-water visualization mode. */
  mode: 'rain-water'
  /** Left pointer index. */
  leftIndex: number
  /** Right pointer index. */
  rightIndex: number
  /** Highest wall observed from the left. */
  leftMax: number
  /** Highest wall observed from the right. */
  rightMax: number
  /** Accumulated trapped water. */
  totalWater: number
  /** Water depth currently resolved for each processed bar. */
  waterDepths: number[]
}

/** Area-view state supported by the container and rain-water modes. */
export type AreaViewPointerState = AreaPointerState | RainWaterPointerState

/** Data and pointer metrics required by the area visualization. */
export type AreaVisualizationState = {
  /** Numeric source array. */
  data: number[]
  /** Pointer metrics for the displayed execution step. */
  areaState: AreaViewPointerState
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
    mode: 'container',
    leftIndex,
    rightIndex,
    currentHeight,
    width,
    currentArea: currentHeight * width,
    bestArea: readNumberVariable(variables, ['best', 'maxArea', 'max']),
  }
}

function getRainWaterDepths({
  data,
  leftIndex,
  rightIndex,
  leftMax,
  rightMax,
  totalWater,
}: {
  data: number[]
  leftIndex: number
  rightIndex: number
  leftMax: number
  rightMax: number
  totalWater: number
}): number[] {
  const prefixMax: number[] = []
  const suffixMax: number[] = []
  let runningMax = 0

  data.forEach((height, index) => {
    runningMax = Math.max(runningMax, height)
    prefixMax[index] = runningMax
  })

  runningMax = 0
  for (let index = data.length - 1; index >= 0; index -= 1) {
    runningMax = Math.max(runningMax, data[index])
    suffixMax[index] = runningMax
  }

  const depths = data.map((height, index) => {
    if (index < leftIndex) return Math.max(0, prefixMax[index] - height)
    if (index > rightIndex) return Math.max(0, suffixMax[index] - height)
    return 0
  })
  const resolvedWater = depths.reduce((sum, depth) => sum + depth, 0)
  const unresolvedWater = totalWater - resolvedWater

  if (unresolvedWater > 0) {
    const leftDepth = Math.max(0, leftMax - data[leftIndex])
    const rightDepth = Math.max(0, rightMax - data[rightIndex])

    if (leftDepth === unresolvedWater) depths[leftIndex] = leftDepth
    else if (rightDepth === unresolvedWater) depths[rightIndex] = rightDepth
  }

  return depths
}

/** Derives rain-water pointer state from a compatible execution step. */
export function getRainWaterPointerState(
  data: number[],
  variables: Record<string, unknown>
): RainWaterPointerState | null {
  const leftIndex = readIntegerVariable(variables, ['l', 'left'])
  const rightIndex = readIntegerVariable(variables, ['r', 'right'])
  const leftMax = readNumberVariable(variables, ['leftMax'])
  const rightMax = readNumberVariable(variables, ['rightMax'])
  const totalWater = readNumberVariable(variables, ['water'])

  if (
    isNull(leftIndex) ||
    isNull(rightIndex) ||
    isUndefined(leftMax) ||
    isUndefined(rightMax) ||
    isUndefined(totalWater) ||
    leftIndex < 0 ||
    rightIndex < 0 ||
    leftIndex >= data.length ||
    rightIndex >= data.length ||
    leftIndex > rightIndex
  ) {
    return null
  }

  return {
    mode: 'rain-water',
    leftIndex,
    rightIndex,
    leftMax,
    rightMax,
    totalWater,
    waterDepths: getRainWaterDepths({
      data,
      leftIndex,
      rightIndex,
      leftMax,
      rightMax,
      totalWater,
    }),
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
  const currentRainWaterState =
    isNumericArray(currentData) && currentStep
      ? getRainWaterPointerState(currentData.map(Number), currentStep.variables)
      : null
  const currentAreaState =
    isNumericArray(currentData) && currentStep
      ? getAreaPointerState(currentData.map(Number), currentStep.variables)
      : null
  const areaStep =
    currentAreaState || currentRainWaterState ? currentStep : fallbackStep
  const data = areaStep?.variables[variableName]

  if (!isNumericArray(data)) return null

  const numericData = data.map(Number)
  const rainWaterState = areaStep
    ? getRainWaterPointerState(numericData, areaStep.variables)
    : null
  if (!isNull(rainWaterState)) {
    return { data: numericData, areaState: rainWaterState }
  }

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
  if (!isHeightVariableName(variableName.toLowerCase())) return false
  const numericValue = value.map(Number)
  if (!isNull(getRainWaterPointerState(numericValue, variables))) return true
  if (isUndefined(readNumberVariable(variables, ['best', 'maxArea', 'max']))) {
    return false
  }

  return !isNull(getAreaPointerState(numericValue, variables))
}
