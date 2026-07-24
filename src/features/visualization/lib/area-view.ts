import {
  arrayOf,
  equals,
  isInteger,
  isNull,
  isNumber,
  isNumericArray,
  isUndefined,
  oneOfValues,
} from '@/shared/lib/guards'
import type { ExecutionState } from '@/entities/execution'

const isHeightVariableName = equals('height')
const isHistogramVariableName = oneOfValues(
  'height',
  'heights',
  'histogram',
  'hs'
)
const isIntegerArray = arrayOf(isInteger)
const HISTOGRAM_STACK_SENTINEL = -1

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

/** Rectangle evaluated after popping one bar from a monotonic stack. */
export type HistogramRectangle = {
  /** Index popped from the monotonic stack. */
  poppedIndex: number
  /** Inclusive left edge of the rectangle. */
  leftIndex: number
  /** Inclusive right edge of the rectangle. */
  rightIndex: number
  /** Height of the popped bar. */
  height: number
  /** Number of bars covered by the rectangle. */
  width: number
  /** Area of the evaluated rectangle. */
  area: number
}

/** Monotonic-stack metrics for a largest-rectangle execution step. */
export type HistogramPointerState = {
  /** Largest-rectangle-in-histogram visualization mode. */
  mode: 'histogram'
  /** Index currently being processed. */
  currentIndex: number
  /** Bar indexes currently held by the monotonic stack, optionally prefixed by -1. */
  stackIndices: number[]
  /** Best rectangle area recorded by the algorithm. */
  bestArea: number
  /** Rectangle currently being evaluated after a pop. */
  rectangle?: HistogramRectangle
}

/** Area-view state supported by container, rain-water, and histogram modes. */
export type AreaViewPointerState =
  | AreaPointerState
  | RainWaterPointerState
  | HistogramPointerState

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

type HistogramRectangleVariables = {
  poppedIndex: number
  height: number
  leftSmallIndex: number
  width: number
}

function readHistogramRectangleVariables(
  variables: Record<string, unknown>,
  stackTop: number
): HistogramRectangleVariables | null {
  const poppedIndex = readIntegerVariable(variables, ['mid', 'top'])
  const height = readNumberVariable(variables, ['h', 'height'])
  const recordedLeftSmallIndex = readIntegerVariable(variables, [
    'leftSmallIndex',
    'left',
  ])
  const width = readIntegerVariable(variables, ['width', 'w'])

  if (isNull(poppedIndex)) return null
  if (isUndefined(height)) return null
  if (isNull(width)) return null

  const leftSmallIndex = isNull(recordedLeftSmallIndex)
    ? stackTop
    : recordedLeftSmallIndex

  return { poppedIndex, height, leftSmallIndex, width }
}

function matchesPoppedBar(
  data: number[],
  { poppedIndex, height }: HistogramRectangleVariables
): boolean {
  const isInBounds = poppedIndex >= 0 && poppedIndex < data.length
  return isInBounds && height === data[poppedIndex]
}

function matchesHistogramSpan({
  rectangleVariables,
  currentIndex,
  stackTop,
}: {
  rectangleVariables: HistogramRectangleVariables
  currentIndex: number
  stackTop: number
}): boolean {
  const { leftSmallIndex, width } = rectangleVariables
  const expectedWidth = currentIndex - leftSmallIndex - 1
  const matchesStackBoundary = leftSmallIndex === stackTop
  const matchesWidth = width === expectedWidth

  return matchesStackBoundary && matchesWidth && width > 0
}

function resolveHistogramCurrentIndex(
  data: number[],
  variables: Record<string, unknown>,
  stackIndices: number[]
): number | null {
  const finalFlushIndex = data.length
  const stackTop = stackIndices[stackIndices.length - 1] ?? -1
  const rectangleVariables = readHistogramRectangleVariables(
    variables,
    stackTop
  )
  const isFinalFlushRectangle =
    !isNull(rectangleVariables) &&
    matchesPoppedBar(data, rectangleVariables) &&
    matchesHistogramSpan({
      rectangleVariables,
      currentIndex: finalFlushIndex,
      stackTop,
    })

  if (isFinalFlushRectangle) return finalFlushIndex

  const currentIndex = variables.i
  if (!isInteger(currentIndex)) return null
  if (currentIndex < 0 || currentIndex > data.length) return null

  return currentIndex
}

function getHistogramRectangle(
  data: number[],
  variables: Record<string, unknown>,
  currentIndex: number,
  stackIndices: number[]
): HistogramRectangle | undefined {
  const stackTop = stackIndices[stackIndices.length - 1] ?? -1
  const rectangleVariables = readHistogramRectangleVariables(
    variables,
    stackTop
  )
  if (isNull(rectangleVariables)) return undefined

  if (!matchesPoppedBar(data, rectangleVariables)) return undefined
  if (
    !matchesHistogramSpan({
      rectangleVariables,
      currentIndex,
      stackTop,
    })
  ) {
    return undefined
  }

  const { poppedIndex, height, leftSmallIndex, width } = rectangleVariables

  const leftIndex = leftSmallIndex + 1
  const rightIndex = currentIndex - 1
  if (poppedIndex < leftIndex || poppedIndex > rightIndex) return undefined

  return {
    poppedIndex,
    leftIndex,
    rightIndex,
    height,
    width,
    area: height * width,
  }
}

function isValidHistogramStackIndex(
  index: number,
  dataLength: number
): boolean {
  return (
    index === HISTOGRAM_STACK_SENTINEL || (index >= 0 && index < dataLength)
  )
}

function isMonotonicHistogramStack(
  data: number[],
  stackIndices: number[],
  currentIndex: number
): boolean {
  return stackIndices.every((index, position) => {
    if (index === HISTOGRAM_STACK_SENTINEL) return position === 0
    if (index > currentIndex) return false
    if (position === 0) return true

    const previousIndex = stackIndices[position - 1]
    const followsPreviousIndex = previousIndex < index
    const followsPreviousHeight =
      previousIndex === HISTOGRAM_STACK_SENTINEL ||
      data[previousIndex] <= data[index]

    return followsPreviousIndex && followsPreviousHeight
  })
}

/** Derives monotonic-stack state for largest-rectangle-in-histogram code. */
export function getHistogramPointerState(
  data: number[],
  variables: Record<string, unknown>
): HistogramPointerState | null {
  const rawStack = variables.stack
  const bestArea = readNumberVariable(variables, ['ans', 'maxArea'])

  if (!isIntegerArray(rawStack)) return null
  if (isUndefined(bestArea)) return null
  if (data.some((height) => height < 0)) return null
  if (
    rawStack.some((index) => !isValidHistogramStackIndex(index, data.length))
  ) {
    return null
  }

  const stackIndices = [...rawStack]
  const currentIndex = resolveHistogramCurrentIndex(
    data,
    variables,
    stackIndices
  )
  if (isNull(currentIndex)) return null

  if (!isMonotonicHistogramStack(data, stackIndices, currentIndex)) return null

  return {
    mode: 'histogram',
    currentIndex,
    stackIndices,
    bestArea,
    rectangle: getHistogramRectangle(
      data,
      variables,
      currentIndex,
      stackIndices
    ),
  }
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
  const totalWater = readNumberVariable(variables, ['water', 'trappedWater'])

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
 * Finds the highest recorded histogram result through a target step.
 *
 * When multiple snapshots have the same best area, the snapshot that shows
 * the rectangle producing that area is preferred over a later stack-only step.
 */
export function getBestHistogramPointerState(
  executionState: ExecutionState,
  variableName: string,
  targetStepIndex?: number
): HistogramPointerState | null {
  const endStepIndex = Math.min(
    targetStepIndex ?? executionState.currentStep,
    executionState.steps.length - 1
  )
  let bestState: HistogramPointerState | null = null

  for (let index = 0; index <= endStepIndex; index += 1) {
    const step = executionState.steps[index]
    const data = step?.variables[variableName]

    if (!isNumericArray(data)) continue

    const histogramState = getHistogramPointerState(
      data.map(Number),
      step.variables
    )
    if (isNull(histogramState)) continue

    const showsBestRectangle =
      histogramState.rectangle?.area === histogramState.bestArea
    const previousShowsBestRectangle =
      bestState?.rectangle?.area === bestState?.bestArea

    if (
      isNull(bestState) ||
      histogramState.bestArea > bestState.bestArea ||
      (histogramState.bestArea === bestState.bestArea &&
        (showsBestRectangle || !previousShowsBestRectangle))
    ) {
      bestState = histogramState
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
  const currentHistogramState =
    isNumericArray(currentData) && currentStep
      ? getHistogramPointerState(currentData.map(Number), currentStep.variables)
      : null
  const currentRainWaterState =
    isNumericArray(currentData) && currentStep
      ? getRainWaterPointerState(currentData.map(Number), currentStep.variables)
      : null
  const currentAreaState =
    isNumericArray(currentData) && currentStep
      ? getAreaPointerState(currentData.map(Number), currentStep.variables)
      : null
  const areaStep =
    currentAreaState || currentRainWaterState || currentHistogramState
      ? currentStep
      : fallbackStep
  const data = areaStep?.variables[variableName]

  if (!isNumericArray(data)) return null

  const numericData = data.map(Number)
  const shouldUseBestAreaState =
    executionState.isComplete || currentStep?.type === 'return'
  const bestHistogramState = shouldUseBestAreaState
    ? getBestHistogramPointerState(
        executionState,
        variableName,
        executionState.currentStep
      )
    : null
  if (!isNull(bestHistogramState)) {
    return { data: numericData, areaState: bestHistogramState }
  }

  const histogramState = areaStep
    ? getHistogramPointerState(numericData, areaStep.variables)
    : null
  if (!isNull(histogramState)) {
    return { data: numericData, areaState: histogramState }
  }

  const rainWaterState = areaStep
    ? getRainWaterPointerState(numericData, areaStep.variables)
    : null
  if (!isNull(rainWaterState)) {
    return { data: numericData, areaState: rainWaterState }
  }

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

/** Checks whether a runtime value represents largest-rectangle stack state. */
export function isHistogramAreaCandidate(
  variableName: string,
  value: unknown,
  variables: Record<string, unknown>
): boolean {
  if (
    !isHistogramVariableName(variableName.toLowerCase()) ||
    !isNumericArray(value) ||
    value.length === 0
  ) {
    return false
  }

  return !isNull(getHistogramPointerState(value.map(Number), variables))
}

/**
 * Checks whether a runtime value represents a supported area problem.
 *
 * @param variableName Candidate source variable name.
 * @param value Candidate runtime value.
 * @param variables Variables captured for the same execution step.
 * @returns Whether the value has compatible area or histogram metadata.
 */
export function isAreaViewCandidate(
  variableName: string,
  value: unknown,
  variables: Record<string, unknown>
): boolean {
  if (isHistogramAreaCandidate(variableName, value, variables)) return true
  if (!isNumericArray(value) || value.length < 2) return false
  if (!isHeightVariableName(variableName.toLowerCase())) return false
  const numericValue = value.map(Number)
  if (!isNull(getRainWaterPointerState(numericValue, variables))) return true
  if (isUndefined(readNumberVariable(variables, ['best', 'maxArea', 'max']))) {
    return false
  }

  return !isNull(getAreaPointerState(numericValue, variables))
}
