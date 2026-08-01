import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import { STEP_TYPES } from '@/entities/execution'
import { getLineNumber, safeGenerate } from './ast-utils'
import { InstrumentationContext } from './context'
import { createRecordStepStatement } from './step-factory'

/** Records suspension, fulfillment, and rejection around each await boundary. */
export const createAwaitVisitor = (context: InstrumentationContext) => ({
  AwaitExpression: {
    exit(path: NodePath<t.AwaitExpression>) {
      if (context.isInstrumented(path.node)) return

      const line = getLineNumber(path.node)
      const source = safeGenerate(path.node.argument)
      const operandId = path.scope.generateUidIdentifier(
        'algorithmVisualizerAwaitOperand'
      )
      const resultId = path.scope.generateUidIdentifier(
        'algorithmVisualizerAwaitResult'
      )
      const errorId = path.scope.generateUidIdentifier(
        'algorithmVisualizerAwaitError'
      )
      const wrappedAwait = t.awaitExpression(operandId)
      const wrapper = context.markInstrumented(
        t.arrowFunctionExpression(
          [operandId],
          t.blockStatement([
            createRecordStepStatement(
              STEP_TYPES.AWAIT_SUSPEND,
              line,
              `Awaiting: ${source}`,
              context.createScopeProperties()
            ),
            t.tryStatement(
              t.blockStatement([
                t.variableDeclaration('const', [
                  t.variableDeclarator(resultId, wrappedAwait),
                ]),
                createRecordStepStatement(
                  STEP_TYPES.AWAIT_RESUME,
                  line,
                  `Resumed after await: ${source}`,
                  context.createScopeProperties()
                ),
                t.returnStatement(resultId),
              ]),
              t.catchClause(
                errorId,
                t.blockStatement([
                  createRecordStepStatement(
                    STEP_TYPES.AWAIT_REJECT,
                    line,
                    `Await rejected: ${source}`,
                    context.createScopeProperties()
                  ),
                  t.throwStatement(errorId),
                ])
              )
            ),
          ]),
          true
        )
      )

      path.replaceWith(
        context.markInstrumented(
          t.awaitExpression(
            context.markInstrumented(
              t.callExpression(wrapper, [path.node.argument])
            )
          )
        )
      )
    },
  },
})
