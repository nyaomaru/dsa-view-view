import type { ExecutionState } from '@/entities/execution'
import { isUndefined } from '@/shared/lib/guards'

/** Returns valid execution-step indexes ordered around the current step. */
export function getExecutionStepSearchOrder({
  executionState,
  targetStepIndex,
  preferPastSteps = false,
}: {
  /** Execution state whose steps should be searched. */
  executionState: ExecutionState
  /** Optional preferred fallback step. */
  targetStepIndex?: number
  /** Whether past steps should be searched before future steps. */
  preferPastSteps?: boolean
}): number[] {
  const { currentStep, steps } = executionState
  const futureStepIndexes = Array.from(
    { length: Math.max(0, steps.length - currentStep - 1) },
    (_, index) => currentStep + index + 1
  )
  const pastStepIndexes = Array.from(
    { length: Math.max(0, currentStep) },
    (_, index) => currentStep - index - 1
  )
  const surroundingStepIndexes = preferPastSteps
    ? [...pastStepIndexes, ...futureStepIndexes]
    : [...futureStepIndexes, ...pastStepIndexes]
  const orderedIndexes = [
    currentStep,
    targetStepIndex,
    ...surroundingStepIndexes,
  ].filter((index): index is number => !isUndefined(index))

  return [...new Set(orderedIndexes)].filter(
    (index) => index >= 0 && index < steps.length
  )
}
