import * as t from '@babel/types'
import { generate } from './babel-compat'

export const UI_PLACEHOLDER = '...'
export const DEFAULT_LINE = 0

export const getLineNumber = (node: t.Node): number =>
  node.loc?.start.line ?? DEFAULT_LINE

export const safeGenerate = (
  node: t.Node | null | undefined,
  fallback = UI_PLACEHOLDER
): string => {
  if (!node) {
    return fallback
  }

  try {
    return generate(node).code
  } catch {
    return fallback
  }
}

export const getMemberPropertyName = (
  expression: t.CallExpression['callee']
): string | null => {
  if (t.isMemberExpression(expression) && t.isIdentifier(expression.property)) {
    return expression.property.name
  }

  return null
}

export const ensureBlockStatement = (
  statement: t.Statement
): t.BlockStatement =>
  t.isBlockStatement(statement) ? statement : t.blockStatement([statement])
