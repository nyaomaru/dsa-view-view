import type { ExecutionState } from '@/entities/execution'
import { RETURN_VALUE_LABEL } from '@/entities/execution'
import { isGraphNodeShape, isTreeNodeShape } from '@/entities/data-structure'
import { isNumericArray, isUndefined } from '@/shared/lib/guards'
import {
  getPrimaryArrayName,
  getPrimaryBooleanArrayName,
  getPrimaryGraphName,
  getPrimaryStackName,
  hasInitialTreeNodeVariable,
} from './array-candidates'
import {
  getPrimaryAreaArrayName,
  getPrimaryAreaStepIndex,
  getPrimaryBinarySearchArrayName,
  getPrimaryBinarySearchStepIndex,
  getPrimaryRollingDpArrayName,
  getPrimarySlidingWindowStepIndex,
  getPrimarySlidingWindowStringName,
} from './indexed-candidates'
import {
  getPrimaryListNodeName,
  getVisualizableListNodeNames,
} from './list-candidates'
import {
  getPrimaryMatrixName,
  getPrimaryMatrixStepIndex,
} from './matrix-candidates'
import { getPrimaryMapName, getPrimaryMapStepIndex } from './map-candidates'
import { collectVisualizationMutationMetadata } from './mutation-metadata'
import {
  getPrimaryConstructedTreeNodeName,
  getPrimaryTreeNodeName,
} from './tree-candidates'
import {
  hasRecursiveCallStack,
  hasSortTrace,
  hasClassDesignTrace,
} from './trace-detection'
import {
  getInitialVariableContext,
  getVisualizableVariableEntries,
  isResultLikeName,
} from './variables'
import type { VisualizationDetection } from './types'

export function detectVisualizationState(
  executionState: ExecutionState
): VisualizationDetection {
  const currentStep = executionState.steps[executionState.currentStep]
  const variableEntries = !isUndefined(currentStep)
    ? getVisualizableVariableEntries(currentStep.variables)
    : []
  const hasRecursion = hasRecursiveCallStack(executionState)
  const isClassDesignTrace = hasClassDesignTrace(executionState)
  const { initialVariableStepNumber, initialVariableNames } =
    getInitialVariableContext(executionState)
  const metadata = collectVisualizationMutationMetadata(executionState)
  const hasSort = hasSortTrace(executionState)
  const prefersResultStack =
    hasInitialTreeNodeVariable(variableEntries, initialVariableNames) &&
    variableEntries.some(
      ([name, value]) => isResultLikeName(name) && isNumericArray(value)
    )

  const primaryArrayName = getPrimaryArrayName(
    variableEntries,
    metadata.mutatedNumericArrayNames,
    { excludeResultLikeArrays: prefersResultStack }
  )
  const primaryStackName = getPrimaryStackName(variableEntries, {
    includeNumericResultArrays: prefersResultStack || !hasSort,
    mutatedNumericArrayNames: metadata.mutatedNumericArrayNames,
  })
  const primaryBinarySearchArrayName = getPrimaryBinarySearchArrayName(
    executionState,
    initialVariableNames
  )
  const primaryBinarySearchStepIndex = getPrimaryBinarySearchStepIndex(
    executionState,
    primaryBinarySearchArrayName
  )
  const primaryAreaArrayName = getPrimaryAreaArrayName(
    executionState,
    initialVariableNames
  )
  const primaryAreaStepIndex = getPrimaryAreaStepIndex(
    executionState,
    primaryAreaArrayName
  )
  const primarySlidingWindowStringName =
    getPrimarySlidingWindowStringName(executionState)
  const primarySlidingWindowStepIndex = getPrimarySlidingWindowStepIndex(
    executionState,
    primarySlidingWindowStringName
  )
  const primaryBooleanArrayName =
    getPrimaryBooleanArrayName(
      variableEntries,
      initialVariableNames,
      metadata.mutatedBooleanArrayNames,
      metadata.mutatedNumericArrayNames
    ) ?? getPrimaryRollingDpArrayName(executionState, initialVariableNames)
  const primaryMapName = getPrimaryMapName(executionState)
  const primaryMapStepIndex = getPrimaryMapStepIndex(
    executionState,
    primaryMapName
  )
  const primaryGraphName = isGraphNodeShape(executionState.returnValue)
    ? RETURN_VALUE_LABEL
    : getPrimaryGraphName(variableEntries, initialVariableNames)
  const primaryMatrixName = getPrimaryMatrixName(
    executionState,
    metadata,
    initialVariableStepNumber,
    initialVariableNames
  )
  const primaryMatrixStepIndex = getPrimaryMatrixStepIndex(
    executionState,
    primaryMatrixName
  )
  const primaryTreeNodeName =
    getPrimaryTreeNodeName(
      variableEntries,
      initialVariableNames,
      metadata.mutatedTreeNodeNames
    ) ??
    getPrimaryConstructedTreeNodeName(
      executionState,
      initialVariableNames,
      metadata.mutatedTreeNodeNames
    ) ??
    (isTreeNodeShape(executionState.returnValue)
      ? RETURN_VALUE_LABEL
      : undefined)
  const primaryListNodeName = getPrimaryListNodeName(variableEntries)
  const visualizableListNodeNames = getVisualizableListNodeNames(executionState)
  const visualizableTreeNodeNames = new Set(
    [...metadata.mutatedTreeNodeNames].filter((name) =>
      initialVariableNames.has(name)
    )
  )
  if (!isUndefined(primaryTreeNodeName)) {
    visualizableTreeNodeNames.add(primaryTreeNodeName)
  }

  return {
    currentStep,
    variableEntries,
    hasRecursion,
    isClassDesignTrace,
    primaryStackName,
    primaryArrayName: hasSort ? primaryArrayName : undefined,
    primaryAreaArrayName,
    primaryAreaStepIndex,
    primaryBinarySearchArrayName,
    primaryBinarySearchStepIndex,
    primarySlidingWindowStringName,
    primarySlidingWindowStepIndex,
    primaryBooleanArrayName,
    primaryMapName,
    primaryMapStepIndex,
    primaryGraphName,
    primaryMatrixName,
    primaryMatrixStepIndex,
    primaryTreeNodeName,
    visualizableTreeNodeNames: [...visualizableTreeNodeNames],
    primaryListNodeName,
    visualizableListNodeNames,
  }
}
