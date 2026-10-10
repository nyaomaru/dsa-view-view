import type { ExecutionState } from '@/entities/execution'
import { isInteger, isNumericArray } from '@/shared/lib/guards'
import { getExecutionStepSearchOrder } from './execution-step-search'

/** State required to explain a cyclic placement in First Missing Positive. */
export type FirstMissingPositiveVisualizationState = {
  data: number[]
  n: number
  index: number
  targetIndex?: number
}

/** Reads the current cyclic-placement state from an execution trace. */
export function getFirstMissingPositiveVisualizationState({
  executionState,
  variableName,
  targetStepIndex,
}: {
  executionState: ExecutionState
  variableName: string
  targetStepIndex?: number
}): FirstMissingPositiveVisualizationState | null {
  const orderedIndexes = getExecutionStepSearchOrder({
    executionState,
    targetStepIndex,
    preferPastSteps: true,
  })

  for (const stepIndex of orderedIndexes) {
    const variables = executionState.steps[stepIndex]?.variables
    const data = variables?.[variableName]
    const n = variables?.n
    const index = variables?.i
    const targetIndex = variables?.targetIndex

    if (!isNumericArray(data) || !isInteger(n) || !isInteger(index)) continue

    return {
      data: data.map(Number),
      n,
      index,
      targetIndex: isInteger(targetIndex) ? targetIndex : undefined,
    }
  }

  return null
}
