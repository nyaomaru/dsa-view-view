import {
  isGraphNodeShape,
  isTreeNodeShape,
  type GraphNodeValue,
} from '@/entities/data-structure'
import {
  isMatrix,
  isNull,
  isNestedArray,
  isNumericArray,
  isArray,
  isNumber,
  isPlainObject,
  isPrimitive,
  isString,
  isSymbol,
  isUndefined,
} from '@/shared/lib/guards'
import { safeStringify } from '@/shared/lib/safe-stringify'

/** Maximum serialized length displayed inline before collapsing a value. */
export const VALUE_PREVIEW_LIMIT = 96

function compareGraphNodes(
  left: GraphNodeValue,
  right: GraphNodeValue
): number {
  if (isNumber(left.val) && isNumber(right.val)) {
    return left.val - right.val
  }

  return 0
}

function getGraphAdjacencyList(value: unknown): unknown[][] | null {
  if (!isGraphNodeShape(value)) return null

  const seen = new WeakSet<object>()
  const nodes: GraphNodeValue[] = []
  const queue: GraphNodeValue[] = [value]
  let head = 0

  while (head < queue.length) {
    const node = queue[head++]

    if (seen.has(node)) continue

    seen.add(node)
    nodes.push(node)
    node.neighbors.forEach((neighbor) => {
      if (isGraphNodeShape(neighbor)) {
        queue.push(neighbor)
      }
    })
  }

  return nodes.sort(compareGraphNodes).map((node) => {
    return node.neighbors
      .filter(isGraphNodeShape)
      .map((neighbor) => neighbor.val)
  })
}

/**
 * Checks whether a return value can be rendered safely in a compact row.
 *
 * @param value Candidate return value.
 * @returns Whether the value is supported and fits within the preview limit.
 */
export const isInlineReturnValue = (value: unknown): boolean => {
  if (isPrimitive(value)) {
    return !isSymbol(value) && !isUndefined(value)
  }

  if (isArray(value)) {
    return stringifyValue(value).length <= VALUE_PREVIEW_LIMIT
  }

  const graphAdjacencyList = getGraphAdjacencyList(value)
  if (!isNull(graphAdjacencyList)) {
    return safeStringify(graphAdjacencyList).length <= VALUE_PREVIEW_LIMIT
  }

  return false
}

/**
 * Produces a stable display string, including adjacency lists for graph nodes.
 *
 * @param value Runtime value to format.
 * @returns Human-readable serialized value.
 */
export const stringifyValue = (value: unknown): string => {
  if (isString(value)) return value

  const graphAdjacencyList = getGraphAdjacencyList(value)
  if (!isNull(graphAdjacencyList)) return safeStringify(graphAdjacencyList)

  return safeStringify(value)
}

/**
 * Creates a summary label for a collapsed complex value.
 *
 * @param value Collapsed runtime value.
 * @returns Field, row, or generic hidden-value label.
 */
export const getCollapsedValueLabel = (value: unknown): string => {
  if (isPlainObject(value)) {
    return `${Object.keys(value).length} fields hidden`
  }

  if (isNestedArray(value)) {
    return `${value.length} rows hidden`
  }

  return 'Value hidden'
}

/**
 * Creates a stable signature for a numeric array.
 *
 * @param value Candidate runtime value.
 * @returns Serialized signature, or `null` when the value is not numeric array.
 */
export const getNumericArraySignature = (value: unknown): string | null => {
  if (!isNumericArray(value)) {
    return null
  }

  return safeStringify(value)
}

/**
 * Creates a stable signature for a rectangular matrix.
 *
 * @param value Candidate runtime value.
 * @returns Serialized signature, or `null` when the value is not a matrix.
 */
export const getMatrixSignature = (value: unknown): string | null => {
  if (!isMatrix(value)) {
    return null
  }

  return safeStringify(value)
}

/**
 * Creates a stable signature for a tree node graph.
 *
 * @param value Candidate runtime value.
 * @returns Serialized signature, or `null` when the value is not a tree node.
 */
export const getTreeNodeSignature = (value: unknown): string | null => {
  if (!isTreeNodeShape(value)) {
    return null
  }

  return safeStringify(value)
}
