import { isGraphNodeShape, isTreeNodeShape } from '@/entities/data-structure'
import {
  isArray,
  isBooleanArray,
  isNumericArray,
  oneOfValues,
} from '@/shared/lib/guards'
import { isAdjacencyListCandidate } from '../../lib/graph-view'
import { isDpVariableName } from '../../lib/dp-view'
import {
  isResultLikeName,
  isResultVariableName,
  isTraversalWorklistName,
  isWorkingPathName,
} from './variables'
import type { VariableEntries } from './types'

const isGraphLikeName = oneOfValues('graph', 'adj', 'adjacency')
const isStackLikeName = oneOfValues('stack', 'signstack', 'signs')

export function getPrimaryArrayName(
  variableEntries: VariableEntries,
  mutatedNumericArrayNames: Set<string>,
  options: { excludeResultLikeArrays?: boolean } = {}
): string | undefined {
  return variableEntries
    .filter(
      ([name, value]) =>
        (!options.excludeResultLikeArrays || !isResultLikeName(name)) &&
        !isWorkingPathName(name) &&
        isNumericArray(value) &&
        value.length > 0 &&
        mutatedNumericArrayNames.has(name)
    )
    .sort(([leftName], [rightName]) => {
      const leftIsResultLike = isResultLikeName(leftName)
      const rightIsResultLike = isResultLikeName(rightName)

      if (leftIsResultLike && !rightIsResultLike) return -1
      if (!leftIsResultLike && rightIsResultLike) return 1

      return 0
    })[0]?.[0]
}

export function getPrimaryStackName(
  variableEntries: VariableEntries,
  options: {
    includeNumericResultArrays?: boolean
    mutatedNumericArrayNames?: Set<string>
  } = {}
): string | undefined {
  return variableEntries.find(([name, value]) => {
    const hasStackSemantics = isStackLikeName(name.toLowerCase())

    return (
      (isResultLikeName(name) || hasStackSemantics) &&
      isArray(value) &&
      value.length > 0 &&
      (!isNumericArray(value) ||
        (options.includeNumericResultArrays &&
          options.mutatedNumericArrayNames?.has(name)))
    )
  })?.[0]
}

export function getPrimaryTraversalResultArrayName(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>,
  mutatedNumericArrayNames: Set<string>
): string | undefined {
  return variableEntries.find(
    ([name, value]) =>
      !initialVariableNames.has(name) &&
      !isWorkingPathName(name) &&
      !isTraversalWorklistName(name) &&
      !isDpVariableName(name.toLowerCase()) &&
      isNumericArray(value) &&
      value.length > 0 &&
      mutatedNumericArrayNames.has(name)
  )?.[0]
}

export function hasInitialTreeNodeVariable(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>
): boolean {
  return variableEntries.some(
    ([name, value]) => initialVariableNames.has(name) && isTreeNodeShape(value)
  )
}

export function getPrimaryDpArrayName(
  variableEntries: VariableEntries,
  mutatedBooleanArrayNames: Set<string>,
  mutatedNumericArrayNames: Set<string>
): string | undefined {
  return variableEntries.find(
    ([name, value]) =>
      !isResultVariableName(name) &&
      (isBooleanArray(value) || isNumericArray(value)) &&
      value.length > 0 &&
      isDpVariableName(name.toLowerCase()) &&
      (mutatedBooleanArrayNames.has(name) || mutatedNumericArrayNames.has(name))
  )?.[0]
}

export function getPrimaryGraphName(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>
): string | undefined {
  const graphNodeName = variableEntries.find(
    ([name, value]) => !isResultVariableName(name) && isGraphNodeShape(value)
  )?.[0]
  if (graphNodeName) return graphNodeName

  return variableEntries
    .filter(
      ([name, value]) =>
        !isResultVariableName(name) &&
        isAdjacencyListCandidate(name, value) &&
        value.length > 0
    )
    .sort(([leftName], [rightName]) => {
      const leftLowerName = leftName.toLowerCase()
      const rightLowerName = rightName.toLowerCase()
      const leftIsGraphLike = isGraphLikeName(leftLowerName)
      const rightIsGraphLike = isGraphLikeName(rightLowerName)

      if (leftIsGraphLike && !rightIsGraphLike) return -1
      if (!leftIsGraphLike && rightIsGraphLike) return 1

      const leftIsDerived = initialVariableNames.has(leftName) ? 1 : 0
      const rightIsDerived = initialVariableNames.has(rightName) ? 1 : 0

      return leftIsDerived - rightIsDerived
    })[0]?.[0]
}
