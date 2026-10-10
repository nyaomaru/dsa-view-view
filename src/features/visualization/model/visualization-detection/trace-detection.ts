import type { ExecutionState } from '@/entities/execution'
import { isInteger, isNumericArray, isString } from '@/shared/lib/guards'
import { VISUALIZATION_CONSTANTS } from '../../constants/constants'

const { RECURSION_DEPTH_THRESHOLD } = VISUALIZATION_CONSTANTS
const CLASS_DESIGN_INPUT_VARIABLE = '__algorithmVisualizerClassDesignInput'
const SORT_TRACE_KEYWORDS = ['sort', 'sorted', 'swap', 'partition', 'pivot']
const POSITIVE_BOUND_COMPARISON =
  /^Compare ([$A-Z_a-z][\w$]*)\[i\] >= 1 -> (?:true|false)$/

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

/** Returns the array placed by the First Missing Positive loop, if present. */
export function getCyclicPlacementArrayName(
  executionState: ExecutionState
): string | undefined {
  const arrayNames = new Set(
    executionState.steps
      .map((step) => POSITIVE_BOUND_COMPARISON.exec(step.description)?.[1])
      .filter(isString)
  )

  for (const arrayName of arrayNames) {
    const hasUpperBound = executionState.steps.some(
      (step) =>
        step.description === `Compare ${arrayName}[i] <= n -> true` ||
        step.description === `Compare ${arrayName}[i] <= n -> false`
    )
    const hasValuePlacementCheck = executionState.steps.some(
      (step) =>
        step.description ===
          `Compare ${arrayName}[${arrayName}[i] - 1] !== ${arrayName}[i] -> true` ||
        step.description ===
          `Compare ${arrayName}[${arrayName}[i] - 1] !== ${arrayName}[i] -> false`
    )
    const hasMissingValueCheck = executionState.steps.some(
      (step) =>
        step.description === `Compare ${arrayName}[i] !== i + 1 -> true` ||
        step.description === `Compare ${arrayName}[i] !== i + 1 -> false`
    )
    const hasLengthBoundArray = executionState.steps.some((step) => {
      const data = step.variables[arrayName]
      const n = step.variables.n

      return (
        isNumericArray(data) &&
        isInteger(n) &&
        n === data.length &&
        isInteger(step.variables.i)
      )
    })

    const hasPlacementProof = hasUpperBound && hasValuePlacementCheck
    const hasFirstMissingPositiveResultCheck = hasMissingValueCheck

    if (
      hasLengthBoundArray &&
      (hasPlacementProof || hasFirstMissingPositiveResultCheck)
    ) {
      return arrayName
    }
  }
}

/** Identifies the value-to-index placement invariant used by First Missing Positive. */
export function hasCyclicPlacementTrace(executionState: ExecutionState): boolean {
  return getCyclicPlacementArrayName(executionState) !== undefined
}
