import type { ExecutionState } from '@/entities/execution'
import { RETURN_VALUE_LABEL } from '@/entities/execution'
import { isGraphNodeShape, isTreeNodeShape } from '@/entities/data-structure'
import { isNumericArray, isUndefined } from '@/shared/lib/guards'
import {
  getPrimaryArrayName,
  getPrimaryDpArrayName,
  getPrimaryGraphName,
  getPrimaryStackName,
  getPrimaryTraversalResultArrayName,
  hasInitialTreeNodeVariable,
} from './array-candidates'
import {
  getPrimaryAreaCandidate,
  getPrimaryBinarySearchCandidate,
  getPrimaryRollingDpName,
  getPrimarySlidingWindowCandidate,
} from './indexed-candidates'
import {
  getPrimaryListNodeName,
  getVisualizableListNodeNames,
} from './list-candidates'
import { getPrimaryMatrixCandidate } from './matrix-candidates'
import { getPrimaryMapCandidate } from './map-candidates'
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
import { getWordLadderStepIndex } from '../../lib/word-ladder-view'
import { getExpressionStepIndex } from '../../lib/expression-view'

export function detectVisualizationState(
  executionState: ExecutionState
): VisualizationDetection {
  const currentStep = executionState.steps[executionState.currentStep]
  const variableEntries = !isUndefined(currentStep)
    ? getVisualizableVariableEntries(currentStep.variables)
    : []
  const hasRecursion = hasRecursiveCallStack(executionState)
  const isClassDesignTrace = hasClassDesignTrace(executionState)
  const primaryWordLadderStepIndex = getWordLadderStepIndex(executionState)
  const primaryExpressionStepIndex = getExpressionStepIndex(executionState)
  const primaryHeapStepIndex = executionState.steps.findIndex((step) => {
    const heaps = step.metadata?.heapTrace?.heaps ?? []
    return (
      heaps.some((heap) => heap.kind === 'min') &&
      heaps.some((heap) => heap.kind === 'max')
    )
  })
  const { initialVariableStepNumber, initialVariableNames } =
    getInitialVariableContext(executionState)
  const metadata = collectVisualizationMutationMetadata(executionState)
  const hasSort = hasSortTrace(executionState)
  const hasInitialTreeNode = hasInitialTreeNodeVariable(
    variableEntries,
    initialVariableNames
  )
  const prefersResultStack =
    hasInitialTreeNode &&
    variableEntries.some(
      ([name, value]) => isResultLikeName(name) && isNumericArray(value)
    )

  const primaryArrayName = getPrimaryArrayName(
    variableEntries,
    metadata.mutatedNumericArrayNames,
    { excludeResultLikeArrays: prefersResultStack }
  )
  const primaryStackName =
    getPrimaryStackName(variableEntries, {
      includeNumericResultArrays: prefersResultStack || !hasSort,
      mutatedNumericArrayNames: metadata.mutatedNumericArrayNames,
    }) ??
    (hasInitialTreeNode
      ? getPrimaryTraversalResultArrayName(
          variableEntries,
          initialVariableNames,
          metadata.mutatedNumericArrayNames
        )
      : undefined)
  const primaryBinarySearchCandidate = getPrimaryBinarySearchCandidate(
    executionState,
    initialVariableNames
  )
  const primaryAreaCandidate = getPrimaryAreaCandidate(
    executionState,
    initialVariableNames
  )
  const primarySlidingWindowCandidate =
    getPrimarySlidingWindowCandidate(executionState)
  const primaryDpName =
    getPrimaryDpArrayName(
      variableEntries,
      metadata.mutatedBooleanArrayNames,
      metadata.mutatedNumericArrayNames
    ) ?? getPrimaryRollingDpName(executionState, initialVariableNames)
  const primaryMapCandidate = getPrimaryMapCandidate(executionState)
  const primaryGraphName = isGraphNodeShape(executionState.returnValue)
    ? RETURN_VALUE_LABEL
    : getPrimaryGraphName(variableEntries, initialVariableNames)
  const primaryMatrixCandidate = getPrimaryMatrixCandidate(
    executionState,
    metadata,
    initialVariableStepNumber,
    initialVariableNames
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
    primaryWordLadderStepIndex,
    primaryExpressionStepIndex,
    primaryHeapStepIndex:
      primaryHeapStepIndex >= 0 ? primaryHeapStepIndex : undefined,
    primaryStackName,
    primaryArrayName: hasSort ? primaryArrayName : undefined,
    primaryAreaArrayName: primaryAreaCandidate?.name,
    primaryAreaStepIndex: primaryAreaCandidate?.stepIndex,
    primaryBinarySearchArrayName: primaryBinarySearchCandidate?.name,
    primaryBinarySearchStepIndex: primaryBinarySearchCandidate?.stepIndex,
    primarySlidingWindowStringName: primarySlidingWindowCandidate?.name,
    primarySlidingWindowStepIndex: primarySlidingWindowCandidate?.stepIndex,
    primaryDpName,
    primaryMapName: primaryMapCandidate?.name,
    primaryMapStepIndex: primaryMapCandidate?.stepIndex,
    primaryGraphName,
    primaryMatrixName: primaryMatrixCandidate?.name,
    primaryMatrixStepIndex: primaryMatrixCandidate?.stepIndex,
    primaryTreeNodeName,
    visualizableTreeNodeNames: [...visualizableTreeNodeNames],
    primaryListNodeName,
    visualizableListNodeNames,
  }
}
