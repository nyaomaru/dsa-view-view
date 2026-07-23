import type { ExecutionState } from '@/entities/execution'
import { isBinarySearchArrayCandidate } from '../../lib/binary-search-view'
import {
  isAreaViewCandidate,
  isHistogramAreaCandidate,
} from '../../lib/area-view'
import { isSlidingWindowCandidate } from '../../lib/sliding-window-view'
import { isRollingDpCandidate } from '../../lib/rolling-dp-view'
import { getExecutionStepSearchOrder } from '../../lib/execution-step-search'
import {
  findIndexedVariableCandidate,
  getAllStepIndexes,
  type IndexedVariableCandidate,
} from './candidate-search'

export function getPrimaryBinarySearchCandidate(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): IndexedVariableCandidate | undefined {
  return findIndexedVariableCandidate(
    executionState,
    getExecutionStepSearchOrder({
      executionState,
      preferPastSteps: true,
    }),
    (name, value, variables) =>
      initialVariableNames.has(name) &&
      isBinarySearchArrayCandidate(name, value, variables)
  )
}

export function getPrimaryAreaCandidate(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): IndexedVariableCandidate | undefined {
  const stepIndexes = getAllStepIndexes(executionState)
  const derivedHistogramCandidate = findIndexedVariableCandidate(
    executionState,
    stepIndexes,
    (name, value, variables) =>
      !initialVariableNames.has(name) &&
      isHistogramAreaCandidate(name, value, variables)
  )

  return (
    derivedHistogramCandidate ??
    findIndexedVariableCandidate(
      executionState,
      stepIndexes,
      (name, value, variables) =>
        initialVariableNames.has(name) &&
        isAreaViewCandidate(name, value, variables)
    )
  )
}

export function getPrimaryRollingDpName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): string | undefined {
  return findIndexedVariableCandidate(
    executionState,
    getAllStepIndexes(executionState),
    (name, value, variables) =>
      initialVariableNames.has(name) &&
      isRollingDpCandidate(name, value, variables)
  )?.name
}

export function getPrimarySlidingWindowCandidate(
  executionState: ExecutionState
): IndexedVariableCandidate | undefined {
  return findIndexedVariableCandidate(
    executionState,
    getExecutionStepSearchOrder({
      executionState,
      preferPastSteps: true,
    }),
    isSlidingWindowCandidate
  )
}
