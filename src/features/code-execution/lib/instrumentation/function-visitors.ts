import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import {
  RETURN_LOCATION_LABEL,
  RETURN_VALUE_LABEL,
  STEP_TYPES,
} from '@/entities/execution'
import {
  isSkippedArrayCallback,
  skipArrayCallbackTraversal,
} from './array-methods'
import { getLineNumber } from './ast-utils'
import { getParameterNames } from './binding-names'
import { InstrumentationContext } from './context'
import { createRecordStepStatement } from './step-factory'

const getMethodName = (method: t.ClassMethod | t.ObjectMethod): string =>
  t.isIdentifier(method.key) ? method.key.name : 'method'

const addImplicitReturnStep = (
  context: InstrumentationContext,
  body: t.BlockStatement,
  functionName: string,
  line: number
): void => {
  const returnLocation = `${functionName} line ${line}`

  body.body.push(
    createRecordStepStatement(
      STEP_TYPES.RETURN,
      line,
      `implicit return from ${returnLocation}: undefined`,
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
}

const wrapFunctionBodyWithThrowStep = (
  context: InstrumentationContext,
  body: t.BlockStatement,
  functionName: string,
  line: number,
  errorId: t.Identifier
): void => {
  const entryStatement = body.body[0]
  if (!entryStatement) return

  const functionBody = body.body.slice(1)
  const throwLocation = `${functionName} line ${line}`
  const throwStep = createRecordStepStatement(
    STEP_TYPES.FUNCTION_THROW,
    line,
    `throw from ${throwLocation}`,
    context.createFrameIdentityProperties()
  )
  const rethrow = context.markInstrumented(
    t.throwStatement(t.identifier(errorId.name))
  )
  const boundary = context.markInstrumented(
    t.tryStatement(
      t.blockStatement(functionBody),
      t.catchClause(errorId, t.blockStatement([throwStep, rethrow]))
    )
  )

  body.body = [entryStatement, boundary]
}

const finishFunction = (
  context: InstrumentationContext,
  body: t.BlockStatement,
  functionName: string,
  line: number,
  errorId: t.Identifier
): void => {
  addImplicitReturnStep(context, body, functionName, line)
  wrapFunctionBodyWithThrowStep(context, body, functionName, line, errorId)
  context.exitFunction()
}

export const createFunctionVisitors = (context: InstrumentationContext) => ({
  FunctionDeclaration: {
    enter(path: NodePath<t.FunctionDeclaration>) {
      const functionName = path.node.id?.name ?? 'anonymous'
      context.enterFunction(
        path.node.body,
        functionName,
        getLineNumber(path.node),
        `Entering function: ${functionName}`,
        getParameterNames(path.node.params),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameId')
      )
    },
    exit(path: NodePath<t.FunctionDeclaration>) {
      const functionName = path.node.id?.name ?? 'anonymous'
      finishFunction(
        context,
        path.node.body,
        functionName,
        path.node.loc?.end.line ?? getLineNumber(path.node),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameError')
      )
    },
  },

  FunctionExpression: {
    enter(path: NodePath<t.FunctionExpression>) {
      if (context.isInstrumented(path.node)) {
        path.skip()
        return
      }
      if (skipArrayCallbackTraversal(path)) return

      context.enterFunction(
        path.node.body,
        'anonymous function',
        getLineNumber(path.node),
        'Entering anonymous function',
        getParameterNames(path.node.params),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameId')
      )
    },
    exit(path: NodePath<t.FunctionExpression>) {
      if (context.isInstrumented(path.node) || isSkippedArrayCallback(path)) {
        return
      }
      finishFunction(
        context,
        path.node.body,
        'anonymous function',
        path.node.loc?.end.line ?? getLineNumber(path.node),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameError')
      )
    },
  },

  ArrowFunctionExpression: {
    enter(path: NodePath<t.ArrowFunctionExpression>) {
      if (context.isInstrumented(path.node)) {
        path.skip()
        return
      }
      if (skipArrayCallbackTraversal(path)) return

      if (!t.isBlockStatement(path.node.body)) {
        path.node.body = t.blockStatement([t.returnStatement(path.node.body)])
      }

      context.enterFunction(
        path.node.body,
        'arrow function',
        getLineNumber(path.node),
        'Entering arrow function',
        getParameterNames(path.node.params),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameId'),
        context.shouldCaptureClassReceiver()
      )
    },
    exit(path: NodePath<t.ArrowFunctionExpression>) {
      if (context.isInstrumented(path.node) || isSkippedArrayCallback(path)) {
        return
      }
      finishFunction(
        context,
        path.node.body as t.BlockStatement,
        'arrow function',
        path.node.loc?.end.line ?? getLineNumber(path.node),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameError')
      )
    },
  },

  ObjectMethod: {
    enter(path: NodePath<t.ObjectMethod>) {
      const methodName = getMethodName(path.node)
      context.enterFunction(
        path.node.body,
        methodName,
        getLineNumber(path.node),
        `Entering method: ${methodName}`,
        getParameterNames(path.node.params),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameId')
      )
    },
    exit(path: NodePath<t.ObjectMethod>) {
      const methodName = getMethodName(path.node)
      finishFunction(
        context,
        path.node.body,
        methodName,
        path.node.loc?.end.line ?? getLineNumber(path.node),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameError')
      )
    },
  },

  ClassMethod: {
    enter(path: NodePath<t.ClassMethod>) {
      const methodName = getMethodName(path.node)
      const classNode = path.parentPath.parentPath?.node
      const isDerivedConstructor =
        path.node.kind === 'constructor' &&
        (t.isClassDeclaration(classNode) || t.isClassExpression(classNode)) &&
        Boolean(classNode.superClass)

      // Any receiver read can throw before a derived constructor reaches super().
      context.enterFunction(
        path.node.body,
        methodName,
        getLineNumber(path.node),
        `Entering method: ${methodName}`,
        getParameterNames(path.node.params),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameId'),
        !isDerivedConstructor
      )
    },
    exit(path: NodePath<t.ClassMethod>) {
      const methodName = getMethodName(path.node)
      finishFunction(
        context,
        path.node.body,
        methodName,
        path.node.loc?.end.line ?? getLineNumber(path.node),
        path.scope.generateUidIdentifier('algorithmVisualizerFrameError')
      )
    },
  },
})
