import * as t from '@babel/types'
import { isString } from '@/shared/lib/guards'

export const createRecordStepCall = (
  stepType: string,
  line: number,
  description: string | t.Expression,
  scopeProperties: t.ObjectProperty[]
): t.CallExpression =>
  t.callExpression(t.identifier('recordStep'), [
    t.stringLiteral(stepType),
    t.numericLiteral(line),
    isString(description) ? t.stringLiteral(description) : description,
    t.objectExpression(scopeProperties),
  ])

export const createRecordStepStatement = (
  stepType: string,
  line: number,
  description: string | t.Expression,
  scopeProperties: t.ObjectProperty[]
): t.ExpressionStatement =>
  t.expressionStatement(
    createRecordStepCall(stepType, line, description, scopeProperties)
  )
