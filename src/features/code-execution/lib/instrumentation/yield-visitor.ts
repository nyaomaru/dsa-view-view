import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import {
  STEP_TYPES,
  YIELD_INPUT_LABEL,
  YIELD_VALUE_LABEL,
} from '@/entities/execution'
import { getLineNumber, safeGenerate } from './ast-utils'
import { InstrumentationContext } from './context'
import { createRecordStepStatement } from './step-factory'

const createIteratorMethod = (
  context: InstrumentationContext,
  parameter: t.Identifier,
  statements: t.Statement[]
): t.FunctionExpression =>
  context.markInstrumented(
    t.functionExpression(null, [parameter], t.blockStatement(statements))
  )

const createDelegatedYield = (
  path: NodePath<t.YieldExpression>,
  context: InstrumentationContext,
  argument: t.Expression,
  line: number,
  source: string
): t.YieldExpression => {
  const iterableId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldIterable'
  )
  const iteratorId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldIterator'
  )
  const startedId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldStarted'
  )
  const wasStartedId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldWasStarted'
  )
  const inputId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldInput'
  )
  const errorId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldError'
  )
  const returnValueId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldReturnValue'
  )
  const nextResultId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldResult'
  )
  const throwResultId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldThrowResult'
  )
  const returnResultId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldReturnResult'
  )
  const createSuspendStep = (resultId: t.Identifier) =>
    createRecordStepStatement(
      STEP_TYPES.YIELD_SUSPEND,
      line,
      `Yielded from delegate: ${source}`,
      context.createScopeProperties([
        t.objectProperty(
          t.stringLiteral(YIELD_VALUE_LABEL),
          t.memberExpression(resultId, t.identifier('value'))
        ),
      ])
    )
  const createResumeStep = (valueId: t.Identifier) =>
    createRecordStepStatement(
      STEP_TYPES.YIELD_RESUME,
      line,
      `Resumed delegated yield: ${source}`,
      context.createScopeProperties([
        t.objectProperty(t.stringLiteral(YIELD_INPUT_LABEL), valueId),
      ])
    )
  const recordSuspendWhenPending = (resultId: t.Identifier) =>
    t.ifStatement(
      t.unaryExpression(
        '!',
        t.memberExpression(resultId, t.identifier('done'))
      ),
      t.blockStatement([createSuspendStep(resultId)])
    )
  const iteratorMethod = context.markInstrumented(
    t.functionExpression(
      null,
      [],
      t.blockStatement([t.returnStatement(t.thisExpression())])
    )
  )
  const nextMethod = createIteratorMethod(context, inputId, [
    t.variableDeclaration('const', [
      t.variableDeclarator(wasStartedId, startedId),
    ]),
    t.ifStatement(
      wasStartedId,
      t.blockStatement([createResumeStep(inputId)]),
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression('=', startedId, t.booleanLiteral(true))
        ),
      ])
    ),
    t.variableDeclaration('const', [
      t.variableDeclarator(
        nextResultId,
        t.conditionalExpression(
          wasStartedId,
          t.callExpression(
            t.memberExpression(iteratorId, t.identifier('next')),
            [inputId]
          ),
          t.callExpression(
            t.memberExpression(iteratorId, t.identifier('next')),
            []
          )
        )
      ),
    ]),
    recordSuspendWhenPending(nextResultId),
    t.returnStatement(nextResultId),
  ])
  const throwMethod = createIteratorMethod(context, errorId, [
    createRecordStepStatement(
      STEP_TYPES.YIELD_THROW,
      line,
      `Delegated generator resumed with throw: ${source}`,
      context.createScopeProperties()
    ),
    t.ifStatement(
      t.binaryExpression(
        '!==',
        t.unaryExpression(
          'typeof',
          t.memberExpression(iteratorId, t.identifier('throw'))
        ),
        t.stringLiteral('function')
      ),
      t.blockStatement([
        t.ifStatement(
          t.binaryExpression(
            '===',
            t.unaryExpression(
              'typeof',
              t.memberExpression(iteratorId, t.identifier('return'))
            ),
            t.stringLiteral('function')
          ),
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(iteratorId, t.identifier('return')),
                []
              )
            ),
          ])
        ),
        t.throwStatement(
          t.newExpression(t.identifier('TypeError'), [
            t.stringLiteral('The delegated iterator has no throw method'),
          ])
        ),
      ])
    ),
    t.variableDeclaration('const', [
      t.variableDeclarator(
        throwResultId,
        t.callExpression(
          t.memberExpression(iteratorId, t.identifier('throw')),
          [errorId]
        )
      ),
    ]),
    recordSuspendWhenPending(throwResultId),
    t.returnStatement(throwResultId),
  ])
  const returnMethod = createIteratorMethod(context, returnValueId, [
    t.ifStatement(
      t.binaryExpression(
        '!==',
        t.unaryExpression(
          'typeof',
          t.memberExpression(iteratorId, t.identifier('return'))
        ),
        t.stringLiteral('function')
      ),
      t.blockStatement([
        t.returnStatement(
          t.objectExpression([
            t.objectProperty(t.identifier('done'), t.booleanLiteral(true)),
            t.objectProperty(t.identifier('value'), returnValueId),
          ])
        ),
      ])
    ),
    t.variableDeclaration('const', [
      t.variableDeclarator(
        returnResultId,
        t.callExpression(
          t.memberExpression(iteratorId, t.identifier('return')),
          [returnValueId]
        )
      ),
    ]),
    recordSuspendWhenPending(returnResultId),
    t.returnStatement(returnResultId),
  ])
  const wrapper = context.markInstrumented(
    t.arrowFunctionExpression(
      [iterableId],
      t.blockStatement([
        t.variableDeclaration('const', [
          t.variableDeclarator(
            iteratorId,
            t.callExpression(
              t.memberExpression(
                iterableId,
                t.memberExpression(
                  t.identifier('Symbol'),
                  t.identifier('iterator')
                ),
                true
              ),
              []
            )
          ),
        ]),
        t.variableDeclaration('let', [
          t.variableDeclarator(startedId, t.booleanLiteral(false)),
        ]),
        t.returnStatement(
          t.objectExpression([
            t.objectProperty(
              t.memberExpression(
                t.identifier('Symbol'),
                t.identifier('iterator')
              ),
              iteratorMethod,
              true
            ),
            t.objectProperty(t.identifier('next'), nextMethod),
            t.objectProperty(t.identifier('throw'), throwMethod),
            t.objectProperty(t.identifier('return'), returnMethod),
          ])
        ),
      ])
    )
  )

  return context.markInstrumented(
    t.yieldExpression(
      context.markInstrumented(t.callExpression(wrapper, [argument])),
      true
    )
  )
}

/** Records suspension and resumption around synchronous yield boundaries. */
export const createYieldVisitor = (context: InstrumentationContext) => ({
  YieldExpression: {
    exit(path: NodePath<t.YieldExpression>) {
      if (
        context.isInstrumented(path.node) ||
        !context.isCurrentFunctionTracedGenerator()
      ) {
        return
      }

      const line = getLineNumber(path.node)
      const argument = path.node.argument ?? t.identifier('undefined')
      const source = path.node.argument
        ? safeGenerate(path.node.argument)
        : 'undefined'

      if (path.node.delegate) {
        path.replaceWith(
          createDelegatedYield(path, context, argument, line, source)
        )
        return
      }
      const operandId = path.scope.generateUidIdentifier(
        'algorithmVisualizerYieldOperand'
      )
      const inputId = path.scope.generateUidIdentifier(
        'algorithmVisualizerYieldInput'
      )
      const errorId = path.scope.generateUidIdentifier(
        'algorithmVisualizerYieldError'
      )
      const innerYield = context.markInstrumented(t.yieldExpression(operandId))
      const wrapper = context.markInstrumented(
        t.functionExpression(
          null,
          [operandId],
          t.blockStatement([
            createRecordStepStatement(
              STEP_TYPES.YIELD_SUSPEND,
              line,
              `Yielded: ${source}`,
              context.createScopeProperties([
                t.objectProperty(t.stringLiteral(YIELD_VALUE_LABEL), operandId),
              ])
            ),
            t.tryStatement(
              t.blockStatement([
                t.variableDeclaration('const', [
                  t.variableDeclarator(inputId, innerYield),
                ]),
                createRecordStepStatement(
                  STEP_TYPES.YIELD_RESUME,
                  line,
                  `Resumed after yield: ${source}`,
                  context.createScopeProperties([
                    t.objectProperty(
                      t.stringLiteral(YIELD_INPUT_LABEL),
                      inputId
                    ),
                  ])
                ),
                t.returnStatement(inputId),
              ]),
              t.catchClause(
                errorId,
                t.blockStatement([
                  createRecordStepStatement(
                    STEP_TYPES.YIELD_THROW,
                    line,
                    `Generator resumed with throw: ${source}`,
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
          t.yieldExpression(
            context.markInstrumented(t.callExpression(wrapper, [argument])),
            true
          )
        )
      )
    },
  },
})
