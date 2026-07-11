import type { TreeNodeValue } from '@/entities/data-structure'
import { isTreeNodeShape } from '@/entities/data-structure'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import {
  FUNCTION_ARGUMENTS_LABEL,
  RETURN_VALUE_LABEL,
} from '@/entities/execution'
import { isNonArrayObject, isNull, isUndefined } from '@/shared/lib/guards'
import { formatDisplayValue } from './display-value'

/**
 * Aggregated return information for one tree path while stepping through
 * recursive tree algorithms.
 */
export type TreeReturnSummary = {
  /** Dot-separated path from the root node, for example `root.left.right`. */
  path: string
  /** Deepest call depth observed for this path. */
  depth: number
  /** Number of completed calls associated with this path. */
  calls: number
  /** Most recent return label for this path. */
  latestReturn?: string
  /** Historical return labels recorded for this path. */
  returns: string[]
}

/**
 * Row rendered in the tree return trace detail table.
 */
export type TreeReturnRow = {
  /** Stable row id derived from entry and return step numbers. */
  id: string
  /** Call depth for indentation and ordering. */
  depth: number
  /** Function or method name from the execution step. */
  functionName: string
  /** Argument name that held the tree node for this call. */
  argumentName: string
  /** Display label for the argument value. */
  argumentValue: string
  /** Dot-separated tree path when the argument can be matched to the root. */
  treePath?: string
  /** Compact return value label. */
  returnValue?: string
  /** Expanded return value detail for structured values. */
  returnDetail?: string
}

/**
 * Derived return trace data for tree visualizations.
 */
export type TreeReturnTrace = {
  /** Return summary keyed by tree path. */
  summaries: Map<string, TreeReturnSummary>
  /** Chronological call/return rows. */
  rows: TreeReturnRow[]
}

/**
 * Internal call stack frame used while pairing function entries with returns.
 */
type CallFrame = {
  /** Entry step id. */
  id: string
  /** Call depth at function entry. */
  depth: number
  /** Function or method name from the entry step. */
  functionName: string
  /** Argument name that carried the tree node value. */
  argumentName: string
  /** Raw argument value captured at entry. */
  argumentValue: unknown
  /** Matched tree path, when available. */
  treePath?: string
}

const stringifyValue = (value: unknown): string => {
  return formatDisplayValue(value, {
    quoteStrings: true,
    undefinedLabel: 'undefined',
  })
}

const formatReturnValue = (
  value: unknown
): { label: string; detail?: string } => {
  if (isTreeNodeShape(value)) {
    return {
      label: `TreeNode(${String(value.val)})`,
      detail: stringifyValue(value),
    }
  }

  return { label: stringifyValue(value) }
}

const getFunctionName = (step: ExecutionStep): string => {
  const match = step.description.match(/^Entering (?:function|method): (.+)$/)
  return match?.[1] ?? 'function'
}

const getArgumentRecord = (step: ExecutionStep): Record<string, unknown> => {
  const args = step.variables[FUNCTION_ARGUMENTS_LABEL]
  return isNonArrayObject(args) ? args : step.variables
}

const sameTree = (
  left: TreeNodeValue | null,
  right: TreeNodeValue | null
): boolean => {
  if (!left || !right) return left === right

  return (
    left.val === right.val &&
    sameTree(left.left, right.left) &&
    sameTree(left.right, right.right)
  )
}

const findTreePath = (
  root: TreeNodeValue | null,
  target: TreeNodeValue,
  path = ''
): string | undefined => {
  if (!root) return undefined
  if (sameTree(root, target)) return path || 'root'

  return (
    findTreePath(root.left, target, `${path || 'root'}.left`) ??
    findTreePath(root.right, target, `${path || 'root'}.right`)
  )
}

const findTreeArgument = (
  args: Record<string, unknown>
): [string, TreeNodeValue | null] | undefined => {
  const entries = Object.entries(args)
  return entries.find(
    ([, value]) => isNull(value) || isTreeNodeShape(value)
  ) as [string, TreeNodeValue | null] | undefined
}

/**
 * Builds tree-return trace rows and path summaries from execution history.
 */
export function buildTreeReturnTrace(
  state: ExecutionState,
  root: TreeNodeValue
): TreeReturnTrace {
  const stack: CallFrame[] = []
  const summaries = new Map<string, TreeReturnSummary>()
  const rows: TreeReturnRow[] = []
  const steps = state.steps.slice(0, state.currentStep + 1)

  steps.forEach((step) => {
    if (step.type === 'function-entry') {
      const args = getArgumentRecord(step)
      const treeArgument = findTreeArgument(args)
      const functionName = getFunctionName(step)
      const depth = stack.length

      if (!treeArgument) {
        stack.push({
          id: `${step.stepNumber}`,
          depth,
          functionName,
          argumentName: '',
          argumentValue: undefined,
        })
        return
      }

      const [argumentName, argumentValue] = treeArgument
      const treePath = isTreeNodeShape(argumentValue)
        ? findTreePath(root, argumentValue)
        : undefined

      stack.push({
        id: `${step.stepNumber}`,
        depth,
        functionName,
        argumentName,
        argumentValue,
        treePath,
      })
      return
    }

    if (step.type !== 'return' || stack.length === 0) return

    const frame = stack.pop()
    if (!frame || !frame.argumentName) return

    const formattedReturn = formatReturnValue(
      step.variables[RETURN_VALUE_LABEL]
    )
    rows.push({
      id: `${frame.id}-${step.stepNumber}`,
      depth: frame.depth,
      functionName: frame.functionName,
      argumentName: frame.argumentName,
      argumentValue: isTreeNodeShape(frame.argumentValue)
        ? String(frame.argumentValue.val)
        : stringifyValue(frame.argumentValue),
      treePath: frame.treePath,
      returnValue: formattedReturn.label,
      returnDetail: formattedReturn.detail,
    })

    if (!frame.treePath) return

    const current = summaries.get(frame.treePath) ?? {
      path: frame.treePath,
      depth: frame.depth,
      calls: 0,
      returns: [],
    }

    current.calls += 1
    if (isUndefined(current.latestReturn) || frame.depth >= current.depth) {
      current.depth = frame.depth
      current.latestReturn = formattedReturn.label
    }
    current.returns.push(formattedReturn.label)
    summaries.set(frame.treePath, current)
  })

  return { summaries, rows }
}
