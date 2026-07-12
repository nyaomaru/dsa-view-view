import { isGraphNodeShape, isTreeNodeShape } from '@/entities/data-structure'
import {
  equals,
  isArray,
  isBooleanArray,
  isNumericArray,
  oneOfValues,
} from '@/shared/lib/guards'
import { isAdjacencyListCandidate } from '../../lib/graph-view'
import {
  isResultLikeName,
  isResultVariableName,
  isWorkingPathName,
} from './variables'
import type { VariableEntries } from './types'

const isDpName = equals('dp')
const isGraphLikeName = oneOfValues('graph', 'adj', 'adjacency')

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
  return variableEntries.find(
    ([name, value]) =>
      isResultLikeName(name) &&
      isArray(value) &&
      value.length > 0 &&
      (!isNumericArray(value) ||
        (options.includeNumericResultArrays &&
          options.mutatedNumericArrayNames?.has(name)))
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

export function getPrimaryBooleanArrayName(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>,
  mutatedBooleanArrayNames: Set<string>,
  mutatedNumericArrayNames: Set<string>
): string | undefined {
  return variableEntries
    .filter(
      ([name, value]) =>
        !isResultVariableName(name) &&
        (isBooleanArray(value) || isNumericArray(value)) &&
        value.length > 0 &&
        isDpName(name.toLowerCase()) &&
        (mutatedBooleanArrayNames.has(name) ||
          mutatedNumericArrayNames.has(name))
    )
    .sort(([leftName], [rightName]) => {
      if (isDpName(leftName.toLowerCase())) return -1
      if (isDpName(rightName.toLowerCase())) return 1

      const leftIsDerived = initialVariableNames.has(leftName) ? 1 : 0
      const rightIsDerived = initialVariableNames.has(rightName) ? 1 : 0

      return leftIsDerived - rightIsDerived
    })[0]?.[0]
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
