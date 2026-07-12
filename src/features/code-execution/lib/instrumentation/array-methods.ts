import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { getMemberPropertyName } from './ast-utils'

export const SKIPPED_ARRAY_METHODS = new Set([
  'sort',
  'reduce',
  'map',
  'filter',
  'forEach',
  'find',
  'findIndex',
  'some',
  'every',
])

export const MUTATING_ARRAY_METHODS = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
])

export const isSkippedArrayCallback = (
  path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>
): boolean => {
  if (!path.parentPath.isCallExpression()) {
    return false
  }

  const methodName = getMemberPropertyName(path.parentPath.node.callee)
  return methodName !== null && SKIPPED_ARRAY_METHODS.has(methodName)
}

export const skipArrayCallbackTraversal = (
  path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>
): boolean => {
  if (!isSkippedArrayCallback(path)) {
    return false
  }

  path.skip()
  return true
}
