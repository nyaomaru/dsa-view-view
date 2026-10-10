import type { ExecutionState } from '@/entities/execution'
import { isInteger, isNumericArray } from '@/shared/lib/guards'
import { VISUALIZATION_CONSTANTS } from '../../constants/constants'

const { RECURSION_DEPTH_THRESHOLD } = VISUALIZATION_CONSTANTS
const CLASS_DESIGN_INPUT_VARIABLE = '__algorithmVisualizerClassDesignInput'
const SORT_TRACE_KEYWORDS = ['sort', 'sorted', 'swap', 'partition', 'pivot']
const CYCLIC_PLACEMENT_VARIABLES = ['i', 'n']

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

/**
 * Identifies cyclic placement from its loop index and the length-bound used to
 * position values. `targetIndex` is intentionally optional: no-swap runs never
 * enter the loop body that declares it.
 */
export function hasCyclicPlacementTrace(executionState: ExecutionState): boolean {
  return executionState.steps.some((step) => {
    const { variables } = step
    const n = variables.n

    return (
      CYCLIC_PLACEMENT_VARIABLES.every((name) => name in variables) &&
      isInteger(n) &&
      Object.values(variables).some(
        (value) => isNumericArray(value) && value.length === n
      )
    )
  })
}
