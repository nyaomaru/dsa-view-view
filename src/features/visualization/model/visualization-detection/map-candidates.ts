import type { ExecutionState } from '@/entities/execution'
import { isNull } from '@/shared/lib/guards'
import { getMapVisualizationState } from '../../lib/map-view'
import {
  findIndexedVariableCandidate,
  getAllStepIndexes,
  type IndexedVariableCandidate,
} from './candidate-search'

export function getPrimaryMapCandidate(
  executionState: ExecutionState
): IndexedVariableCandidate | undefined {
  return findIndexedVariableCandidate(
    executionState,
    getAllStepIndexes(executionState),
    (name, value, variables) =>
      !isNull(getMapVisualizationState(name, value, variables))
  )
}
