import type { ExecutionState } from '@/entities/execution'
import { isInteger, isNumericArray, isString } from '@/shared/lib/guards'
import { getExecutionStepSearchOrder } from './execution-step-search'

/** A factoradic selection step while constructing the k-th permutation. */
export type PermutationVisualizationState = {
  /** Values that have not yet been removed from the candidate pool. */
  numbers: number[]
  /** Precomputed factorials used to size each lexicographic block. */
  factorial: number[]
  /** Number of positions still being chosen. */
  remain: number
  /** Number of permutations represented by one candidate at this position. */
  blockSize: number
  /** Candidate position selected by the current zero-based rank. */
  index: number
  /** Current zero-based rank within the active block. */
  rank: number
  /** Digits already committed to the answer. */
  result: string
  /** Whether the highlighted candidate has already been appended to result. */
  selectionIsCommitted: boolean
}

type PermutationSnapshot = PermutationVisualizationState & {
  stepIndex: number
}

function getPermutationSnapshot(
  step: ExecutionState['steps'][number],
  stepIndex: number
): PermutationSnapshot | undefined {
  const { numbers, factorial, n, remain, blockSize, index, k, result } =
    step.variables

  if (
    !isNumericArray(numbers) ||
    !isNumericArray(factorial) ||
    !isInteger(n) ||
    !isInteger(remain) ||
    !isInteger(blockSize) ||
    !isInteger(index) ||
    !isInteger(k) ||
    !isString(result) ||
    n < 1 ||
    remain < 1 ||
    remain > n ||
    factorial.length !== n + 1 ||
    factorial[0] !== 1 ||
    blockSize !== factorial[remain - 1] ||
    index < 0 ||
    index >= numbers.length ||
    k < 0 ||
    numbers.length !== remain
  ) {
    return undefined
  }

  const numericNumbers = numbers.map(Number)
  const numericFactorial = factorial.map(Number)
  const hasOrderedCandidates = numericNumbers.every(
    (value, candidateIndex) =>
      Number.isInteger(value) &&
      value >= 1 &&
      value <= n &&
      (candidateIndex === 0 || value > numericNumbers[candidateIndex - 1]!)
  )
  const hasFactorials = numericFactorial.every(
    (value, factorialIndex) =>
      Number.isInteger(value) &&
      (factorialIndex === 0 || value === numericFactorial[factorialIndex - 1]! * factorialIndex)
  )

  if (!hasOrderedCandidates || !hasFactorials) return undefined

  return {
    stepIndex,
    numbers: numericNumbers,
    factorial: numericFactorial,
    remain,
    blockSize,
    index,
    rank: k,
    result,
    selectionIsCommitted: result.endsWith(String(numericNumbers[index])),
  }
}

/** Finds the first factoradic permutation-selection snapshot in a trace. */
export function getPermutationStepIndex(
  executionState: ExecutionState
): number | undefined {
  const stepIndex = executionState.steps.findIndex((step, index) =>
    getPermutationSnapshot(step, index)
  )

  return stepIndex >= 0 ? stepIndex : undefined
}

/** Resolves the nearest factoradic selection state for the current playback step. */
export function getPermutationVisualizationState(
  executionState: ExecutionState,
  targetStepIndex?: number
): PermutationVisualizationState | undefined {
  const orderedIndexes = getExecutionStepSearchOrder({
    executionState,
    targetStepIndex: executionState.currentStep ?? targetStepIndex,
    preferPastSteps: true,
  })

  for (const stepIndex of orderedIndexes) {
    const step = executionState.steps[stepIndex]
    if (!step) continue

    const snapshot = getPermutationSnapshot(step, stepIndex)
    if (snapshot) {
      const { stepIndex: _, ...state } = snapshot
      return state
    }
  }
}
