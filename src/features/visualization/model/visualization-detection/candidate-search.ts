import type { ExecutionState } from '@/entities/execution'
import { isUndefined } from '@/shared/lib/guards'
import { getVisualizableVariableEntries } from './variables'

export type IndexedVariableCandidate = {
  /** Candidate variable name. */
  name: string
  /** Array index of the step containing compatible context. */
  stepIndex: number
}

/** Finds the first compatible variable in an explicitly ordered step list. */
export function findIndexedVariableCandidate(
  executionState: ExecutionState,
  stepIndexes: readonly number[],
  predicate: (
    name: string,
    value: unknown,
    variables: Record<string, unknown>
  ) => boolean
): IndexedVariableCandidate | undefined {
  for (const stepIndex of stepIndexes) {
    const step = executionState.steps[stepIndex]
    if (isUndefined(step)) continue

    const name = getVisualizableVariableEntries(step.variables).find(
      ([candidateName, value]) =>
        predicate(candidateName, value, step.variables)
    )?.[0]

    if (!isUndefined(name)) return { name, stepIndex }
  }

  return undefined
}

/** Returns every execution-step array index in chronological order. */
export function getAllStepIndexes(executionState: ExecutionState): number[] {
  return executionState.steps.map((_, index) => index)
}
