import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { isInteger, isString } from '@/shared/lib/guards'

export type RegexMatchState = {
  source: string
  pattern: string
  current: { i: number; j: number }
  visited: ReadonlySet<string>
}

function readRegexMatchState(
  step: ExecutionStep
): { source: string; pattern: string; i: number; j: number } | null {
  const { s, p, i, j } = step.variables

  if (
    !isString(s) ||
    !isString(p) ||
    !isInteger(i) ||
    !isInteger(j) ||
    i < 0 ||
    j < 0 ||
    i > s.length ||
    j > p.length
  ) {
    return null
  }

  return { source: s, pattern: p, i, j }
}

/** Finds the first recursive regular-expression matching state. */
export function getRegexMatchStepIndex(
  executionState: ExecutionState
): number | undefined {
  const index = executionState.steps.findIndex((step) =>
    Boolean(readRegexMatchState(step))
  )

  return index >= 0 ? index : undefined
}

/** Builds the explored memoization grid up to the selected execution step. */
export function getRegexMatchVisualizationState(
  executionState: ExecutionState,
  fallbackStepIndex?: number
): RegexMatchState | null {
  const currentLimit = Math.min(
    executionState.currentStep,
    executionState.steps.length - 1
  )
  const fallbackLimit = Math.min(
    fallbackStepIndex ?? currentLimit,
    executionState.steps.length - 1
  )
  const hasCurrentState = executionState.steps
    .slice(0, currentLimit + 1)
    .some((step) => Boolean(readRegexMatchState(step)))
  const limit = hasCurrentState ? currentLimit : fallbackLimit
  let current: RegexMatchState['current'] | null = null
  let source: string | null = null
  let pattern: string | null = null
  const visited = new Set<string>()

  for (let index = 0; index <= limit; index++) {
    const step = executionState.steps[index]
    if (!step) continue

    const state = readRegexMatchState(step)
    if (!state) continue

    if (source === null) {
      source = state.source
      pattern = state.pattern
    }
    if (state.source !== source || state.pattern !== pattern) continue

    current = { i: state.i, j: state.j }
    visited.add(`${state.i},${state.j}`)
  }

  return source !== null && pattern !== null && current !== null
    ? { source, pattern, current, visited }
    : null
}
