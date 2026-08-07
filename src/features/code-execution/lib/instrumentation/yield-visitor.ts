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
  const nextMethodId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldNext'
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
  const throwMethodId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldThrowMethod'
  )
  const returnMethodId = path.scope.generateUidIdentifier(
    'algorithmVisualizerYieldReturnMethod'
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
  const createSuspendStep = (valueId: t.Identifier) =>
    createRecordStepStatement(
      STEP_TYPES.YIELD_SUSPEND,
      line,
      `Yielded from delegate: ${source}`,
      context.createScopeProperties([
        t.objectProperty(t.stringLiteral(YIELD_VALUE_LABEL), valueId),
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
  const createNormalizedResultStatements = (resultId: t.Identifier) => {
    const doneId = path.scope.generateUidIdentifier(
      'algorithmVisualizerYieldDone'
    )
    const valueId = path.scope.generateUidIdentifier(
      'algorithmVisualizerYieldValue'
    )

    return [
      t.ifStatement(
        t.logicalExpression(
          '&&',
          t.logicalExpression(
            '||',
            t.binaryExpression(
              '!==',
              t.unaryExpression('typeof', resultId),
              t.stringLiteral('object')
            ),
            t.binaryExpression('===', resultId, t.nullLiteral())
          ),
          t.binaryExpression(
            '!==',
            t.unaryExpression('typeof', resultId),
            t.stringLiteral('function')
          )
        ),
        t.blockStatement([
          t.throwStatement(
            t.newExpression(t.identifier('TypeError'), [
              t.stringLiteral('Iterator result is not an object'),
            ])
          ),
        ])
      ),
      t.variableDeclaration('const', [
        t.variableDeclarator(
          doneId,
          t.memberExpression(resultId, t.identifier('done'))
        ),
        t.variableDeclarator(
          valueId,
          t.memberExpression(resultId, t.identifier('value'))
        ),
      ]),
      t.ifStatement(
        t.unaryExpression('!', doneId),
        t.blockStatement([createSuspendStep(valueId)])
      ),
      t.returnStatement(
        t.objectExpression([
          t.objectProperty(t.identifier('done'), doneId),
          t.objectProperty(t.identifier('value'), valueId),
        ])
      ),
    ]
  }
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
            t.memberExpression(nextMethodId, t.identifier('call')),
            [iteratorId, inputId]
          ),
          t.callExpression(
            t.memberExpression(nextMethodId, t.identifier('call')),
            [iteratorId]
          )
        )
      ),
    ]),
    ...createNormalizedResultStatements(nextResultId),
  ])
  const throwMethod = createIteratorMethod(context, errorId, [
    createRecordStepStatement(
      STEP_TYPES.YIELD_THROW,
      line,
      `Delegated generator resumed with throw: ${source}`,
      context.createScopeProperties()
    ),
    t.variableDeclaration('const', [
      t.variableDeclarator(
        throwMethodId,
        t.memberExpression(iteratorId, t.identifier('throw'))
      ),
    ]),
    t.ifStatement(
      t.logicalExpression(
        '||',
        t.binaryExpression('===', throwMethodId, t.nullLiteral()),
        t.binaryExpression(
          '===',
          throwMethodId,
          t.unaryExpression('void', t.numericLiteral(0))
        ),
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
    t.ifStatement(
      t.binaryExpression(
        '!==',
        t.unaryExpression('typeof', throwMethodId),
        t.stringLiteral('function')
      ),
      t.blockStatement([
        t.throwStatement(
          t.newExpression(t.identifier('TypeError'), [
            t.stringLiteral(
              'The delegated iterator throw method is not callable'
            ),
          ])
        ),
      ])
    ),
    t.variableDeclaration('const', [
      t.variableDeclarator(
        throwResultId,
        t.callExpression(
          t.memberExpression(throwMethodId, t.identifier('call')),
          [iteratorId, errorId]
        )
      ),
    ]),
    ...createNormalizedResultStatements(throwResultId),
  ])
  const returnMethod = createIteratorMethod(context, returnValueId, [
    t.variableDeclaration('const', [
      t.variableDeclarator(
        returnMethodId,
        t.memberExpression(iteratorId, t.identifier('return'))
      ),
    ]),
    t.ifStatement(
      t.logicalExpression(
        '||',
        t.binaryExpression('===', returnMethodId, t.nullLiteral()),
        t.binaryExpression(
          '===',
          returnMethodId,
          t.unaryExpression('void', t.numericLiteral(0))
        )
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
    t.ifStatement(
      t.binaryExpression(
        '!==',
        t.unaryExpression('typeof', returnMethodId),
        t.stringLiteral('function')
      ),
      t.blockStatement([
        t.throwStatement(
          t.newExpression(t.identifier('TypeError'), [
            t.stringLiteral(
              'The delegated iterator return method is not callable'
            ),
          ])
        ),
      ])
    ),
    t.variableDeclaration('const', [
      t.variableDeclarator(
        returnResultId,
        t.callExpression(
          t.memberExpression(returnMethodId, t.identifier('call')),
          [iteratorId, returnValueId]
        )
      ),
    ]),
    ...createNormalizedResultStatements(returnResultId),
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
        t.variableDeclaration('const', [
          t.variableDeclarator(
            nextMethodId,
            t.memberExpression(iteratorId, t.identifier('next'))
          ),
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
