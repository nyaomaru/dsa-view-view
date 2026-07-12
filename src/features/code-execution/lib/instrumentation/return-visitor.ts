import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import {
  RETURN_LOCATION_LABEL,
  RETURN_VALUE_LABEL,
  STEP_TYPES,
} from '@/entities/execution'
import { getLineNumber, safeGenerate } from './ast-utils'
import { InstrumentationContext } from './context'
import { createRecordStepStatement } from './step-factory'

const RETURN_TEMP_NAME = 'algorithmVisualizerReturnValue'

const getReturnArgumentDescription = (argument: t.Expression): string => {
  if (
    t.isFunctionExpression(argument) ||
    t.isArrowFunctionExpression(argument)
  ) {
    return 'function'
  }
  return safeGenerate(argument)
}

export const createReturnVisitor = (context: InstrumentationContext) => ({
  ReturnStatement(path: NodePath<t.ReturnStatement>) {
    if (context.isInstrumented(path.node)) return

    const line = getLineNumber(path.node)
    const returnLocation = `${context.getCurrentFunctionName()} line ${line}`

    if (path.node.argument) {
      const tempId = path.scope.generateUidIdentifier(RETURN_TEMP_NAME)
      const declaration = context.markInstrumented(
        t.variableDeclaration('const', [
          t.variableDeclarator(tempId, path.node.argument),
        ])
      )
      const recordStep = createRecordStepStatement(
        STEP_TYPES.RETURN,
        line,
        `return from ${returnLocation}: ${getReturnArgumentDescription(path.node.argument)}`,
        context.createScopeProperties([
          t.objectProperty(t.stringLiteral(RETURN_VALUE_LABEL), tempId),
          t.objectProperty(
            t.stringLiteral(RETURN_LOCATION_LABEL),
            t.stringLiteral(returnLocation)
          ),
        ])
      )
      const returnStatement = context.markInstrumented(
        t.returnStatement(tempId)
      )
      path.replaceWithMultiple([declaration, recordStep, returnStatement])
      return
    }

    path.insertBefore(
      createRecordStepStatement(
        STEP_TYPES.RETURN,
        line,
        `return from ${returnLocation}: undefined`,
        context.createScopeProperties([
          t.objectProperty(
            t.stringLiteral(RETURN_VALUE_LABEL),
            t.identifier('undefined')
          ),
          t.objectProperty(
            t.stringLiteral(RETURN_LOCATION_LABEL),
            t.stringLiteral(returnLocation)
          ),
        ])
      )
    )
    context.markInstrumented(path.node)
  },
})
