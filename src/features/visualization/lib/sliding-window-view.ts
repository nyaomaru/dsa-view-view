import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import {
  isInteger,
  isNull,
  isSet,
  isString,
  isStringArray,
} from '@/shared/lib/guards'

const STRING_SOURCE_NAMES = new Set(['s', 'str', 'text'])
const PATTERN_SOURCE_NAMES = ['p', 'pattern', 't', 'word'] as const
type SlidingWindowRangeMode = 'inclusive' | 'half-open'

/** Window boundaries and optional pattern metadata for one execution step. */
export type SlidingWindowState = {
  /** Inclusive left boundary. */
  left: number
  /** Inclusive right boundary, or exclusive boundary in half-open mode. */
  right: number
  /** Whether the window includes or excludes its right boundary. */
  rangeMode: SlidingWindowRangeMode
  /** Current window size when available. */
  windowSize?: number
  /** Optional pattern used by the window algorithm. */
  pattern?: string
  /** Optional set of unique characters currently in the window. */
  setValues?: readonly string[]
  /** Best window length found so far. */
  best?: number
}

/** Source string and boundaries required by the sliding-window visualization. */
export type SlidingWindowVisualizationState = {
  /** Source string displayed by the visualization. */
  data: string
  /** Valid window boundaries and metadata. */
  windowState: SlidingWindowState
}

function readWindowSize(
  variables: ExecutionStep['variables']
): number | undefined {
  const size = variables.m ?? variables.k ?? variables.windowSize

  return isInteger(size) && size > 0 ? size : undefined
}

function readPattern(
  variables: ExecutionStep['variables']
): string | undefined {
  for (const name of PATTERN_SOURCE_NAMES) {
    const value = variables[name]

    if (isString(value) && value.length > 0) return value
  }

  return undefined
}

function readUniqueCharacterSet(
  variables: ExecutionStep['variables']
): readonly string[] | undefined {
  const set = variables.set
  const best = variables.best

  if (!isSet(set) || !isInteger(best) || best < 0) return undefined

  const values = Array.from(set)

  return isStringArray(values) ? values : undefined
}

function inferRangeMode(
  value: string,
  left: number,
  right: number,
  setValues: readonly string[] | undefined
): SlidingWindowRangeMode {
  if (
    setValues !== undefined &&
    (right === value.length || setValues.length === right - left)
  ) {
    return 'half-open'
  }

  return 'inclusive'
}

function getTraceRangeMode(
  executionState: ExecutionState,
  variableName: string
): SlidingWindowRangeMode | undefined {
  for (let index = executionState.steps.length - 1; index >= 0; index--) {
    const variables = executionState.steps[index]?.variables
    const value = variables?.[variableName]
    const left = variables?.left ?? variables?.l
    const right = variables?.right ?? variables?.r
    const setValues = variables && readUniqueCharacterSet(variables)

    if (
      !isString(value) ||
      !isInteger(left) ||
      !isInteger(right) ||
      setValues === undefined
    ) {
      continue
    }

    if (right === value.length || setValues.length === right - left) {
      return 'half-open'
    }

    if (setValues.length === right - left + 1) return 'inclusive'
  }

  return undefined
}

/**
 * Derives valid sliding-window boundaries from a value and execution variables.
 *
 * @param value Candidate source string.
 * @param variables Variables captured for one execution step.
 * @returns Window state, or `null` when boundaries are absent or invalid.
 */
export function getSlidingWindowState(
  value: unknown,
  variables: ExecutionStep['variables'],
  rangeModeOverride?: SlidingWindowRangeMode
): SlidingWindowState | null {
  if (!isString(value) || value.length === 0) return null

  const left = variables.left ?? variables.l
  const right = variables.right ?? variables.r
  const setValues = readUniqueCharacterSet(variables)

  if (!isInteger(left) || !isInteger(right)) {
    return null
  }

  const rangeMode =
    rangeModeOverride ?? inferRangeMode(value, left, right, setValues)

  const maximumBoundary =
    rangeMode === 'half-open' ? value.length : value.length - 1

  if (
    left < 0 ||
    right < 0 ||
    left > maximumBoundary ||
    right > maximumBoundary
  ) {
    return null
  }

  if (left > right) {
    return null
  }

  return {
    left,
    right,
    rangeMode,
    windowSize:
      rangeMode === 'half-open'
        ? right - left
        : setValues !== undefined
          ? right - left + 1
          : readWindowSize(variables),
    pattern: readPattern(variables),
    setValues,
    best:
      setValues !== undefined && isInteger(variables.best)
        ? variables.best
        : undefined,
  }
}

/**
 * Checks whether a runtime value should use the sliding-window visualization.
 *
 * @param name Candidate source variable name.
 * @param value Candidate runtime value.
 * @param variables Variables captured for the same execution step.
 * @returns Whether the value has a recognized name and valid window state.
 */
export function isSlidingWindowCandidate(
  name: string,
  value: unknown,
  variables: ExecutionStep['variables']
): boolean {
  if (!STRING_SOURCE_NAMES.has(name.toLowerCase())) return false

  return !isNull(getSlidingWindowState(value, variables))
}

/**
 * Resolves the source string and window state displayed for an execution step.
 *
 * @param options Execution state, source variable name, and optional target step.
 * @returns Visualization state, or `null` when no valid window can be resolved.
 */
export function getSlidingWindowVisualizationState({
  executionState,
  variableName,
  targetStepIndex,
}: {
  executionState: ExecutionState
  variableName: string
  targetStepIndex?: number
}): SlidingWindowVisualizationState | null {
  const rangeMode = getTraceRangeMode(executionState, variableName)
  const currentStep = executionState.steps[executionState.currentStep]
  const fallbackStep =
    executionState.steps[targetStepIndex ?? executionState.currentStep]
  const currentValue = currentStep?.variables[variableName]
  const currentWindowState =
    currentStep &&
    getSlidingWindowState(currentValue, currentStep.variables, rangeMode)
  const windowStep = currentWindowState ? currentStep : fallbackStep
  const data = windowStep?.variables[variableName]

  if (!isString(data) || !windowStep) return null

  const windowState =
    currentWindowState ??
    getSlidingWindowState(data, windowStep.variables, rangeMode)

  return isNull(windowState) ? null : { data, windowState }
}
