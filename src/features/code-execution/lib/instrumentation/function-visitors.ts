import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import {
  isSkippedArrayCallback,
  skipArrayCallbackTraversal,
} from './array-methods'
import { getLineNumber } from './ast-utils'
import { getParameterNames } from './binding-names'
import { InstrumentationContext } from './context'

export const createFunctionVisitors = (context: InstrumentationContext) => ({
  FunctionDeclaration: {
    enter(path: NodePath<t.FunctionDeclaration>) {
      const functionName = path.node.id?.name ?? 'anonymous'
      context.enterFunction(
        path.node.body,
        functionName,
        getLineNumber(path.node),
        `Entering function: ${functionName}`,
        getParameterNames(path.node.params)
      )
    },
    exit() {
      context.exitFunction()
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
        getParameterNames(path.node.params)
      )
    },
    exit(path: NodePath<t.FunctionExpression>) {
      if (context.isInstrumented(path.node) || isSkippedArrayCallback(path)) {
        return
      }
      context.exitFunction()
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
        context.shouldCaptureClassReceiver()
      )
    },
    exit(path: NodePath<t.ArrowFunctionExpression>) {
      if (context.isInstrumented(path.node) || isSkippedArrayCallback(path)) {
        return
      }
      context.exitFunction()
    },
  },

  ClassMethod: {
    enter(path: NodePath<t.ClassMethod>) {
      const methodName = t.isIdentifier(path.node.key)
        ? path.node.key.name
        : 'method'
      context.enterFunction(
        path.node.body,
        methodName,
        getLineNumber(path.node),
        `Entering method: ${methodName}`,
        getParameterNames(path.node.params),
        true
      )
    },
    exit() {
      context.exitFunction()
    },
  },
})
