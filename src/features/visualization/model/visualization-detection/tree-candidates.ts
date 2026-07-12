import type { ExecutionState } from '@/entities/execution'
import { isTreeNodeShape, type TreeNodeValue } from '@/entities/data-structure'
import { isNull, isUndefined, oneOfValues } from '@/shared/lib/guards'
import { getVisualizableVariableEntries } from './variables'
import type { VariableEntries } from './types'

const isConstructedTreeName = oneOfValues('root', 'result')
const isRootName = oneOfValues('root')

export function getPrimaryTreeNodeName(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>,
  mutatedTreeNodeNames: Set<string>
): string | undefined {
  const initialTreeEntries = variableEntries.filter(
    (entry): entry is [string, TreeNodeValue] =>
      isTreeNodeShape(entry[1]) && initialVariableNames.has(entry[0])
  )
  const mutatedTreeName = initialTreeEntries.find(([name]) =>
    mutatedTreeNodeNames.has(name)
  )?.[0]

  if (!isUndefined(mutatedTreeName)) return mutatedTreeName

  return initialTreeEntries
    .filter(([, root]) =>
      initialTreeEntries.some(
        ([, target]) => target !== root && treeContainsNode(root, target)
      )
    )
    .sort(
      (left, right) => countTreeNodes(right[1]) - countTreeNodes(left[1])
    )[0]?.[0]
}

export function getPrimaryConstructedTreeNodeName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>,
  mutatedTreeNodeNames: Set<string>
): string | undefined {
  if (!isTreeNodeShape(executionState.returnValue)) return undefined

  const candidateNames = new Set<string>()

  executionState.steps.forEach((step) => {
    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      const lowerName = name.toLowerCase()

      if (
        isTreeNodeShape(value) &&
        !initialVariableNames.has(name) &&
        (mutatedTreeNodeNames.has(name) || isConstructedTreeName(lowerName))
      ) {
        candidateNames.add(name)
      }
    })
  })

  return [...candidateNames].sort((left, right) => {
    if (isRootName(left.toLowerCase())) return -1
    if (isRootName(right.toLowerCase())) return 1

    return left.localeCompare(right)
  })[0]
}

function treeContainsNode(root: TreeNodeValue, target: TreeNodeValue): boolean {
  const pending = [root]
  const seen = new WeakSet<object>()

  while (pending.length > 0) {
    const node = pending.pop()
    if (isUndefined(node) || seen.has(node)) continue
    if (node === target) return true

    seen.add(node)
    if (!isNull(node.left)) pending.push(node.left)
    if (!isNull(node.right)) pending.push(node.right)
  }

  return false
}

function countTreeNodes(root: TreeNodeValue): number {
  const pending = [root]
  const seen = new WeakSet<object>()
  let count = 0

  while (pending.length > 0) {
    const node = pending.pop()
    if (isUndefined(node) || seen.has(node)) continue

    seen.add(node)
    count += 1
    if (!isNull(node.left)) pending.push(node.left)
    if (!isNull(node.right)) pending.push(node.right)
  }

  return count
}
