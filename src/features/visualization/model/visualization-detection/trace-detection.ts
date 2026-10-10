import type { ExecutionState } from '@/entities/execution'
import { VISUALIZATION_CONSTANTS } from '../../constants/constants'

const { RECURSION_DEPTH_THRESHOLD } = VISUALIZATION_CONSTANTS
const CLASS_DESIGN_INPUT_VARIABLE = '__algorithmVisualizerClassDesignInput'
const SORT_TRACE_KEYWORDS = ['sort', 'sorted', 'swap', 'partition', 'pivot']
const CYCLIC_PLACEMENT_VARIABLES = ['i', 'n', 'targetIndex']

export function hasClassDesignTrace(executionState: ExecutionState): boolean {
  return executionState.steps.some((step) =>
    step.description.includes(CLASS_DESIGN_INPUT_VARIABLE)
  )
}

export function hasRecursiveCallStack(executionState: ExecutionState): boolean {
  return executionState.steps.some(
    (step) => (step.callStack?.length ?? 0) > RECURSION_DEPTH_THRESHOLD
  )
}

export function hasSortTrace(executionState: ExecutionState): boolean {
  return executionState.steps.some((step) => {
    const traceText = [step.description, ...(step.callStack ?? [])]
      .join(' ')
      .toLowerCase()

    return SORT_TRACE_KEYWORDS.some((keyword) => traceText.includes(keyword))
  })
}

/** Identifies in-place cyclic placement without relying on sorting terminology. */
export function hasCyclicPlacementTrace(executionState: ExecutionState): boolean {
  return executionState.steps.some((step) =>
    CYCLIC_PLACEMENT_VARIABLES.every((name) => name in step.variables)
  )
}
