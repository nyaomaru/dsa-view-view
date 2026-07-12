import type { ExecutionState } from '@/entities/execution'
import { isMatrix, isUndefined } from '@/shared/lib/guards'
import { isAdjacencyListCandidate } from '../../lib/graph-view'
import {
  getVisualizableVariableEntries,
  isConstantLikeName,
  isTraversalWorklistName,
  isResultVariableName,
} from './variables'
import type { VisualizationMutationMetadata } from './types'

function shouldTrackMatrixName(
  name: string,
  mutatedMatrixNames: Set<string>
): boolean {
  return !isResultVariableName(name) || mutatedMatrixNames.has(name)
}

function collectMatrixCandidateNames(
  executionState: ExecutionState,
  mutatedMatrixNames: Set<string>,
  initialVariableNames: Set<string>
): string[] {
  const matrixNames = new Set<string>()

  executionState.steps.forEach((step) => {
    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      if (
        shouldTrackMatrixName(name, mutatedMatrixNames) &&
        isMatrix(value) &&
        !isAdjacencyListCandidate(name, value) &&
        (!initialVariableNames.has(name) || mutatedMatrixNames.has(name))
      ) {
        matrixNames.add(name)
      }
    })
  })

  return [...matrixNames].filter((name) => {
    const values = executionState.steps
      .map((step) => step.variables[name])
      .filter((value) => !isUndefined(value))

    return values.length > 0 && values.every(isMatrix)
  })
}

function scoreMatrixCandidate({
  name,
  metadata,
  initialVariableStepNumber,
}: {
  name: string
  metadata: VisualizationMutationMetadata
  initialVariableStepNumber: number
}): number {
  const firstMatrixStep =
    metadata.firstMatrixStepByName.get(name) ?? initialVariableStepNumber
  const isDerivedMatrix = firstMatrixStep > initialVariableStepNumber

  return (
    (metadata.mutatedMatrixNames.has(name) ? 4 : 0) +
    (isDerivedMatrix ? 2 : 0) -
    (isConstantLikeName(name) ? 3 : 0) -
    (isTraversalWorklistName(name) ? 3 : 0)
  )
}

export function getPrimaryMatrixName(
  executionState: ExecutionState,
  metadata: VisualizationMutationMetadata,
  initialVariableStepNumber: number,
  initialVariableNames: Set<string>
): string | undefined {
  return collectMatrixCandidateNames(
    executionState,
    metadata.mutatedMatrixNames,
    initialVariableNames
  )
    .map((name) => ({
      name,
      score: scoreMatrixCandidate({
        name,
        metadata,
        initialVariableStepNumber,
      }),
    }))
    .sort((left, right) => right.score - left.score)[0]?.name
}

export function getPrimaryMatrixStepIndex(
  executionState: ExecutionState,
  primaryMatrixName: string | undefined
): number | undefined {
  if (isUndefined(primaryMatrixName)) return undefined

  const primaryMatrixStepIndex = executionState.steps.findIndex((step) =>
    isMatrix(step.variables[primaryMatrixName])
  )

  return primaryMatrixStepIndex >= 0 ? primaryMatrixStepIndex : undefined
}
