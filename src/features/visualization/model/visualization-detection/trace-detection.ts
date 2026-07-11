import type { ExecutionState } from '@/entities/execution'
import { VISUALIZATION_CONSTANTS } from '../../constants/constants'

const { RECURSION_DEPTH_THRESHOLD } = VISUALIZATION_CONSTANTS
const CLASS_DESIGN_INPUT_VARIABLE = '__algorithmVisualizerClassDesignInput'
const SORT_TRACE_KEYWORDS = ['sort', 'sorted', 'swap', 'partition', 'pivot']

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
