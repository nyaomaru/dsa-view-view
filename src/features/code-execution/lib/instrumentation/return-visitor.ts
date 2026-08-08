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
const RETURN_RECORDER_NAME = 'algorithmVisualizerReturnRecorder'

const getReturnArgumentDescription = (argument: t.Expression): string => {
  if (
    t.isFunctionExpression(argument) ||
    t.isArrowFunctionExpression(argument)
  ) {
    return 'function'
  }
  return safeGenerate(argument)
}

const getOutermostPendingFinalizer = (
  path: NodePath<t.ReturnStatement>
): t.BlockStatement | undefined => {
  const ancestry = path.getAncestry()
  const containingNodes = new Set(ancestry.map((ancestor) => ancestor.node))
  let finalizer: t.BlockStatement | undefined

  for (const ancestor of ancestry) {
    if (ancestor.isFunction()) break
    if (!ancestor.isTryStatement()) continue

    const candidate = ancestor.node.finalizer
    if (!candidate || containingNodes.has(candidate)) continue
    finalizer = candidate
  }

  return finalizer
}

const deferTerminalStepUntilFinalizer = (
  context: InstrumentationContext,
  path: NodePath<t.ReturnStatement>,
  finalizer: t.BlockStatement,
  terminalStatements: t.Statement[]
): t.Statement[] => {
  const recorderId = path.scope.generateUidIdentifier(RETURN_RECORDER_NAME)
  const recorderDeclaration = context.markInstrumented(
    t.variableDeclaration('var', [t.variableDeclarator(recorderId)])
  )
  const recorderAssignment = context.markInstrumented(
    t.expressionStatement(
      context.markInstrumented(
        t.assignmentExpression(
          '=',
          recorderId,
          context.markInstrumented(
            t.arrowFunctionExpression(
              [],
              t.blockStatement(terminalStatements)
            )
          )
        )
      )
    )
  )
  const invokeRecorder = context.markInstrumented(
    t.callExpression(recorderId, [])
  )
  finalizer.body.push(
    context.markInstrumented(
      t.ifStatement(
        recorderId,
        t.blockStatement([t.expressionStatement(invokeRecorder)])
      )
    )
  )

  return [recorderDeclaration, recorderAssignment]
}

export const createReturnVisitor = (context: InstrumentationContext) => {
  const argumentDescriptions = new WeakMap<t.ReturnStatement, string>()

  return {
    ReturnStatement: {
      enter(path: NodePath<t.ReturnStatement>) {
        if (context.isInstrumented(path.node) || !path.node.argument) return

        argumentDescriptions.set(
          path.node,
          getReturnArgumentDescription(path.node.argument)
        )
      },
      exit(path: NodePath<t.ReturnStatement>) {
        if (context.isInstrumented(path.node)) return

        const line = getLineNumber(path.node)
        const returnLocation = `${context.getCurrentFunctionName()} line ${line}`
        const completionIdentifier =
          context.getCurrentFrameCompletionIdentifier()
        const pendingFinalizer = completionIdentifier
          ? getOutermostPendingFinalizer(path)
          : undefined
        const markFrameCompleted = completionIdentifier
          ? context.markInstrumented(
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  t.identifier(completionIdentifier.name),
                  t.booleanLiteral(true)
                )
              )
            )
          : undefined

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
            `return from ${returnLocation}: ${argumentDescriptions.get(path.node) ?? getReturnArgumentDescription(path.node.argument)}`,
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
          const terminalStatements = [
            ...(markFrameCompleted ? [markFrameCompleted] : []),
            recordStep,
          ]
          const deferredStatements = pendingFinalizer
            ? deferTerminalStepUntilFinalizer(
                context,
                path,
                pendingFinalizer,
                terminalStatements
              )
            : terminalStatements
          path.replaceWithMultiple([
            declaration,
            ...deferredStatements,
            returnStatement,
          ])
          return
        }

        const terminalStatements = [
          ...(markFrameCompleted ? [markFrameCompleted] : []),
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
          ),
        ]
        path.insertBefore(
          pendingFinalizer
            ? deferTerminalStepUntilFinalizer(
                context,
                path,
                pendingFinalizer,
                terminalStatements
              )
            : terminalStatements
        )
        context.markInstrumented(path.node)
      },
    },
  }
}
