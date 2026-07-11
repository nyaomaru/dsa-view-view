import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { isInteger, isNull, isString } from '@/shared/lib/guards'

const STRING_SOURCE_NAMES = new Set(['s', 'str', 'text'])
const PATTERN_SOURCE_NAMES = ['p', 'pattern', 'word'] as const

/** Window boundaries and optional pattern metadata for one execution step. */
export type SlidingWindowState = {
  /** Inclusive left boundary. */
  left: number
  /** Inclusive right boundary. */
  right: number
  /** Optional algorithm-provided window size. */
  windowSize?: number
  /** Optional pattern used by the window algorithm. */
  pattern?: string
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

/**
 * Derives valid sliding-window boundaries from a value and execution variables.
 *
 * @param value Candidate source string.
 * @param variables Variables captured for one execution step.
 * @returns Window state, or `null` when boundaries are absent or invalid.
 */
export function getSlidingWindowState(
  value: unknown,
  variables: ExecutionStep['variables']
): SlidingWindowState | null {
  if (!isString(value) || value.length === 0) return null

  const left = variables.left
  const right = variables.right

  if (!isInteger(left) || !isInteger(right)) {
    return null
  }

  if (left < 0 || right < 0 || left >= value.length || right >= value.length) {
    return null
  }

  if (left > right) {
    return null
  }

  return {
    left,
    right,
    windowSize: readWindowSize(variables),
    pattern: readPattern(variables),
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
  const currentStep = executionState.steps[executionState.currentStep]
  const fallbackStep =
    executionState.steps[targetStepIndex ?? executionState.currentStep]
  const currentValue = currentStep?.variables[variableName]
  const currentWindowState =
    currentStep && getSlidingWindowState(currentValue, currentStep.variables)
  const windowStep = currentWindowState ? currentStep : fallbackStep
  const data = windowStep?.variables[variableName]

  if (!isString(data) || !windowStep) return null

  const windowState =
    currentWindowState ?? getSlidingWindowState(data, windowStep.variables)

  return isNull(windowState) ? null : { data, windowState }
}
