import {
  define,
  hasKeys,
  isArray,
  isNil,
  isNull,
  isString,
  isUndefined,
  type Guard,
} from '@/shared/lib/guards'
import { safeStringify } from '@/shared/lib/safe-stringify'

/**
 * Runtime binary-tree node shape prepared for user algorithms.
 */
export type TreeNodeValue = {
  /** Node value. */
  val: unknown
  /** Left child node, or null when absent. */
  left: TreeNodeValue | null
  /** Right child node, or null when absent. */
  right: TreeNodeValue | null
}

export type TreeNodeReferenceOption = {
  value: string
  label: string
  path: string
  isDuplicateValue: boolean
}

export function unwrapQuotedString(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}

export function parsePrimitiveToken(value: string): unknown {
  const trimmed = unwrapQuotedString(value)
  const normalized = trimmed.toLowerCase()

  if (normalized === 'null') return null
  if (normalized === 'undefined') return undefined
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed)

  return trimmed
}

export function splitCommaSeparatedTokens(value: string): string[] {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function parseLevelOrderToken(token: string): unknown {
  const parsed = parsePrimitiveToken(token)
  return isUndefined(parsed) ? null : parsed
}

function parseLevelOrderInput(value: string): unknown[] {
  const trimmed = unwrapQuotedString(value)

  if (trimmed === '' || trimmed.toLowerCase() === 'null') {
    return []
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (isArray(parsed)) {
        return parsed.map((item) => item ?? null)
      }
    } catch {
      // Fall back to comma-separated parsing.
    }
  }

  return splitCommaSeparatedTokens(trimmed).map(parseLevelOrderToken)
}

function createTreeNode(val: unknown): TreeNodeValue {
  return { val, left: null, right: null }
}

const hasTreeNodeKeys = hasKeys('val', 'left', 'right')

export const isTreeNodeShape: Guard<TreeNodeValue> = define<TreeNodeValue>(
  (value): value is TreeNodeValue => {
    if (!hasTreeNodeKeys(value)) return false

    return (
      (isNull(value.left) || isTreeNodeShape(value.left)) &&
      (isNull(value.right) || isTreeNodeShape(value.right))
    )
  }
)

export function buildTreeFromLevelOrder(
  values: unknown[]
): TreeNodeValue | null {
  if (values.length === 0 || isNil(values[0])) {
    return null
  }

  const root = createTreeNode(values[0])
  const queue: TreeNodeValue[] = [root]
  let index = 1

  while (queue.length > 0 && index < values.length) {
    const current = queue.shift()
    if (!current) break

    const leftValue = values[index++]
    if (!isNil(leftValue)) {
      current.left = createTreeNode(leftValue)
      queue.push(current.left)
    }

    const rightValue = values[index++]
    if (!isNil(rightValue)) {
      current.right = createTreeNode(rightValue)
      queue.push(current.right)
    }
  }

  return root
}

export function parseTreeInput(value: unknown): TreeNodeValue | null {
  if (isNil(value)) return null
  if (isTreeNodeShape(value)) return value

  if (isString(value)) {
    const trimmed = unwrapQuotedString(value)

    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return null
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        return isTreeNodeShape(parsed) ? parsed : null
      } catch {
        return null
      }
    }

    const levelOrder = parseLevelOrderInput(trimmed)
    return buildTreeFromLevelOrder(levelOrder)
  }

  return createTreeNode(value)
}

export function looksLikeTreeStructureInput(value: unknown): boolean {
  if (isNil(value)) return true
  if (isTreeNodeShape(value)) return true
  if (!isString(value)) return false

  const trimmed = unwrapQuotedString(value)
  return (
    trimmed.includes(',') ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    trimmed.toLowerCase() === 'null'
  )
}

function findNodeByValue(
  root: TreeNodeValue | null,
  target: unknown
): TreeNodeValue | null {
  if (!root) return null

  const queue: TreeNodeValue[] = [root]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    if (current.val === target) {
      return current
    }

    if (current.left) queue.push(current.left)
    if (current.right) queue.push(current.right)
  }

  return null
}

function findNodeByPath(
  root: TreeNodeValue | null,
  path: string
): TreeNodeValue | null {
  if (!root) return null

  let current: TreeNodeValue | null = root
  for (const direction of path) {
    if (!current) return null
    if (direction === 'L') {
      current = current.left
      continue
    }
    if (direction === 'R') {
      current = current.right
      continue
    }

    return null
  }

  return current
}

function formatTreeNodePath(path: string): string {
  return path === '' ? 'root' : path.split('').join('')
}

function formatReferenceValue(value: unknown): string {
  if (isString(value)) return value
  if (isUndefined(value)) return 'undefined'
  return safeStringify(value)
}

function getReferenceKey(value: unknown): string {
  return `${Object.prototype.toString.call(value)}:${formatReferenceValue(value)}`
}

export function getTreeNodeReferenceOptions(
  root: TreeNodeValue | null
): TreeNodeReferenceOption[] {
  if (!root) return []

  const nodes: Array<{ node: TreeNodeValue; path: string }> = []
  const queue: Array<{ node: TreeNodeValue; path: string }> = [
    { node: root, path: '' },
  ]
  const valueCounts = new Map<string, number>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    nodes.push(current)
    const key = getReferenceKey(current.node.val)
    valueCounts.set(key, (valueCounts.get(key) ?? 0) + 1)

    if (current.node.left) {
      queue.push({ node: current.node.left, path: `${current.path}L` })
    }
    if (current.node.right) {
      queue.push({ node: current.node.right, path: `${current.path}R` })
    }
  }

  return nodes.map(({ node, path }) => {
    const displayValue = formatReferenceValue(node.val)
    const isDuplicateValue =
      (valueCounts.get(getReferenceKey(node.val)) ?? 0) > 1

    return {
      value: isDuplicateValue ? `path:${path}` : `value:${displayValue}`,
      label: isDuplicateValue
        ? `${displayValue} (path: ${formatTreeNodePath(path)})`
        : displayValue,
      path: formatTreeNodePath(path),
      isDuplicateValue,
    }
  })
}

export function getTreeNodeReferenceValue(
  root: TreeNodeValue | null,
  value: unknown
): string {
  if (isNil(value)) return 'null'
  if (!root) return formatReferenceValue(value)
  if (isString(value)) {
    const trimmed = unwrapQuotedString(value)
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return 'null'
    if (
      trimmed.toLowerCase().startsWith('path:') ||
      trimmed.toLowerCase().startsWith('value:')
    ) {
      return trimmed
    }
  }

  const target = isString(value) ? parsePrimitiveToken(value) : value
  const queue: Array<{ node: TreeNodeValue; path: string }> = [
    { node: root, path: '' },
  ]
  const options = getTreeNodeReferenceOptions(root)

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    if (current.node.val === target) {
      return (
        options.find((option) =>
          option.isDuplicateValue
            ? option.value === `path:${current.path}`
            : option.value === `value:${formatReferenceValue(target)}`
        )?.value ?? formatReferenceValue(value)
      )
    }

    if (current.node.left) {
      queue.push({ node: current.node.left, path: `${current.path}L` })
    }
    if (current.node.right) {
      queue.push({ node: current.node.right, path: `${current.path}R` })
    }
  }

  return formatReferenceValue(value)
}

export function resolveTreeNodeReference(
  root: TreeNodeValue | null,
  value: unknown
): TreeNodeValue | null {
  if (isNil(value)) return null
  if (isTreeNodeShape(value)) return value
  if (!root) return null

  if (isString(value)) {
    const trimmed = unwrapQuotedString(value)
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return null

    if (trimmed.toLowerCase().startsWith('path:')) {
      return findNodeByPath(root, trimmed.slice(5).trim().toUpperCase())
    }

    if (trimmed.toLowerCase().startsWith('value:')) {
      return findNodeByValue(root, parsePrimitiveToken(trimmed.slice(6)))
    }

    return findNodeByValue(root, parsePrimitiveToken(trimmed))
  }

  return findNodeByValue(root, value)
}
