import {
  isAdjacencyList,
  isInteger,
  isMatrix,
  isNumber,
  oneOfValues,
} from '@/shared/lib/guards'
import {
  isGraphNodeShape,
  type GraphNodeValue,
} from '@/entities/data-structure'

const GRAPH_VARIABLE_NAMES = new Set([
  'adj',
  'adjacency',
  'adjacencylist',
  'adjlist',
  'graph',
])
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
  if (!isGraphVariableName(name)) return false
  if (!isAdjacencyList(value) && !isMatrix(value)) return false
  if (isSquareBinaryMatrix(value)) return false

  return value.every((neighbors) =>
    neighbors.every(
      (neighbor) =>
        isInteger(neighbor) && neighbor >= 0 && neighbor < value.length
    )
  )
}

/** Converts a cyclic graph-node structure into the record consumed by Graph View. */
export function getGraphNodeAdjacencyRecord(
  value: unknown
): Record<number, number[]> | null {
  if (!isGraphNodeShape(value)) return null

  const seen = new WeakSet<object>()
  const queue: GraphNodeValue[] = [value]
  const adjacency: Record<number, number[]> = {}

  while (queue.length > 0) {
    const node = queue.shift()
    if (!node || seen.has(node)) continue
    if (!isNumber(node.val) || !Number.isFinite(node.val)) return null
    if (node.val in adjacency) return null

    seen.add(node)
    const neighbors: number[] = []
    for (const neighbor of node.neighbors) {
      if (!isNumber(neighbor.val) || !Number.isFinite(neighbor.val)) {
        return null
      }

      neighbors.push(neighbor.val)
      queue.push(neighbor)
    }
    adjacency[node.val] = neighbors
  }

  return adjacency
}
