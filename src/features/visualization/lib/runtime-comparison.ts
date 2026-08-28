import type { ExecutionState, RuntimeComparison } from '@/entities/execution'

/** Returns the latest comparison evaluated at or before the playback step. */
export function getLatestRuntimeComparison(
  executionState: ExecutionState
): RuntimeComparison | undefined {
  for (let index = executionState.currentStep; index >= 0; index -= 1) {
    const comparison = executionState.steps[index]?.metadata?.comparison
    if (comparison) return comparison
  }

  return undefined
}
