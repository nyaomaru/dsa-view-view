import {
  isAdjacencyList,
  isInteger,
  isMatrix,
  oneOfValues,
} from '@/shared/lib/guards'

const GRAPH_VARIABLE_NAMES = new Set(['adj', 'adjacency', 'graph'])
const isBinaryCell = oneOfValues(0, 1, '0', '1')

function isGraphVariableName(name: string): boolean {
  return GRAPH_VARIABLE_NAMES.has(name.toLowerCase())
}

function isSquareBinaryMatrix(value: readonly (readonly unknown[])[]): boolean {
  return (
    value.every((row) => row.length === value.length) &&
    value.every((row) => row.every(isBinaryCell))
  )
}

/**
 * Identifies adjacency lists, including graph variables whose node degrees
 * happen to produce a rectangular array.
 */
export function isAdjacencyListCandidate(
  name: string,
  value: unknown
): value is readonly (readonly unknown[])[] {
  if (isAdjacencyList(value)) return true
  if (!isGraphVariableName(name) || !isMatrix(value)) return false
  if (isSquareBinaryMatrix(value)) return false

  return value.every((neighbors) =>
    neighbors.every(
      (neighbor) =>
        isInteger(neighbor) && neighbor >= 0 && neighbor < value.length
    )
  )
}
