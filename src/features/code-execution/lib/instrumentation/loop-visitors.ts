import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import { STEP_TYPES } from '@/entities/execution'
import {
  ensureBlockStatement,
  getLineNumber,
  safeGenerate,
  UI_PLACEHOLDER,
} from './ast-utils'
import { collectBindingNames } from './binding-names'
import { InstrumentationContext } from './context'
import { createRecordStepStatement } from './step-factory'

const addLoopEntryStep = (
  context: InstrumentationContext,
  body: t.Statement,
  line: number,
  description: string
): t.BlockStatement => {
  const block = ensureBlockStatement(body)
  block.body.unshift(
    createRecordStepStatement(
      STEP_TYPES.LOOP_ITERATION,
      line,
      description,
      context.createScopeProperties()
    )
  )
  return block
}

const addDeclarationBindings = (
  context: InstrumentationContext,
  declaration: t.VariableDeclaration
): void => {
  context.addVariablesToCurrentScope(
    declaration.declarations.flatMap((declarator) =>
      collectBindingNames(declarator.id)
    )
  )
}

export const createLoopVisitors = (context: InstrumentationContext) => ({
  WhileStatement: {
    enter(path: NodePath<t.WhileStatement>) {
      context.pushScope()
      if (context.isInstrumented(path.node)) return

      path.node.body = addLoopEntryStep(
        context,
        path.node.body,
        getLineNumber(path.node),
        `while (${safeGenerate(path.node.test)})`
      )
      context.markInstrumented(path.node)
    },
    exit() {
      context.popScope()
    },
  },

  ForStatement: {
    enter(path: NodePath<t.ForStatement>) {
      context.pushScope()
      if (context.isInstrumented(path.node)) return

      if (path.node.init && t.isVariableDeclaration(path.node.init)) {
        addDeclarationBindings(context, path.node.init)
      }
      const condition = path.node.test
        ? safeGenerate(path.node.test)
        : UI_PLACEHOLDER
      path.node.body = addLoopEntryStep(
        context,
        path.node.body,
        getLineNumber(path.node),
        `for (...; ${condition}; ...)`
      )
      context.markInstrumented(path.node)
    },
    exit() {
      context.popScope()
    },
  },

  ForOfStatement: {
    enter(path: NodePath<t.ForOfStatement>) {
      context.pushScope()
      if (context.isInstrumented(path.node)) return

      if (t.isVariableDeclaration(path.node.left)) {
        addDeclarationBindings(context, path.node.left)
      }
      path.node.body = addLoopEntryStep(
        context,
        path.node.body,
        getLineNumber(path.node),
        `for (... of ${safeGenerate(path.node.right)})`
      )
      context.markInstrumented(path.node)
    },
    exit() {
      context.popScope()
    },
  },

  ForInStatement: {
    enter(path: NodePath<t.ForInStatement>) {
      context.pushScope()
      if (context.isInstrumented(path.node)) return

      if (t.isVariableDeclaration(path.node.left)) {
        addDeclarationBindings(context, path.node.left)
      }
      path.node.body = addLoopEntryStep(
        context,
        path.node.body,
        getLineNumber(path.node),
        `for (... in ${safeGenerate(path.node.right)})`
      )
      context.markInstrumented(path.node)
    },
    exit() {
      context.popScope()
    },
  },

  BlockStatement: {
    enter() {
      context.pushScope()
    },
    exit() {
      context.popScope()
    },
  },
})
