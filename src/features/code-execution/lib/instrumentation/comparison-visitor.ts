import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import { isRuntimeComparisonOperator, STEP_TYPES } from '@/entities/execution'
import { getLineNumber, safeGenerate } from './ast-utils'
import { InstrumentationContext } from './context'
import { createRecordStepStatement } from './step-factory'

type ComparisonTrace = {
  leftExpression: string
  rightExpression: string
  source: string
}

function runsBeforeTrackedBindingsInitialize(
  path: NodePath<t.BinaryExpression>
): boolean {
  const ancestry = path.getAncestry()
  const containingNodes = new Set<t.Node>([
    path.node,
    ...ancestry.map((ancestor) => ancestor.node),
  ])

  for (const ancestor of ancestry) {
    if (
      ancestor.isFunction() &&
      !containingNodes.has(ancestor.node.body)
    ) {
      return true
    }

    if (
      ancestor.isForStatement() &&
      t.isVariableDeclaration(ancestor.node.init) &&
      containingNodes.has(ancestor.node.init)
    ) {
      return true
    }

    if (
      (ancestor.isForInStatement() || ancestor.isForOfStatement()) &&
      t.isVariableDeclaration(ancestor.node.left) &&
      (containingNodes.has(ancestor.node.left) ||
        containingNodes.has(ancestor.node.right))
    ) {
      return true
    }
  }

  return false
}

function hasSuspendingOperand(path: NodePath<t.BinaryExpression>): boolean {
  let hasSuspendingOperand = false

  path.traverse({
    Function(functionPath) {
      functionPath.skip()
    },
    AwaitExpression(awaitPath) {
      hasSuspendingOperand = true
      awaitPath.stop()
    },
    YieldExpression(yieldPath) {
      hasSuspendingOperand = true
      yieldPath.stop()
    },
  })

  return hasSuspendingOperand
}

function hasDirectEvalOperand(path: NodePath<t.BinaryExpression>): boolean {
  let hasDirectEvalOperand = false

  path.traverse({
    CallExpression(callPath) {
      if (!t.isIdentifier(callPath.node.callee, { name: 'eval' })) return

      hasDirectEvalOperand = true
      callPath.stop()
    },
  })

  return hasDirectEvalOperand
}

function createOperandMetadata(
  expression: string,
  valueIdentifier: t.Identifier
): t.ObjectExpression {
  return t.objectExpression([
    t.objectProperty(t.identifier('expression'), t.stringLiteral(expression)),
    t.objectProperty(t.identifier('value'), valueIdentifier),
  ])
}

function declareComparisonTemporary(
  context: InstrumentationContext,
  path: NodePath<t.BinaryExpression>,
  identifier: t.Identifier
): void {
  context.registerInternalBinding(identifier.name)
  path.scope.push({ id: identifier, kind: 'var' })

  const declaration = path.scope.getBinding(identifier.name)?.path.parentPath
  if (declaration?.isVariableDeclaration()) {
    context.markInstrumented(declaration.node)
  }
}

/** Records evaluated operands and outcomes for synchronous comparisons. */
export function createComparisonVisitor(context: InstrumentationContext) {
  const comparisonTraces = new WeakMap<t.BinaryExpression, ComparisonTrace>()

  return {
    BinaryExpression: {
      enter(path: NodePath<t.BinaryExpression>) {
        if (
          context.isInstrumented(path.node) ||
          !isRuntimeComparisonOperator(path.node.operator) ||
          runsBeforeTrackedBindingsInitialize(path)
        ) {
          return
        }

        comparisonTraces.set(path.node, {
          leftExpression: safeGenerate(path.node.left),
          rightExpression: safeGenerate(path.node.right),
          source: safeGenerate(path.node),
        })
      },
      exit(path: NodePath<t.BinaryExpression>) {
        if (
          context.isInstrumented(path.node) ||
          hasSuspendingOperand(path) ||
          hasDirectEvalOperand(path)
        ) {
          return
        }

        const trace = comparisonTraces.get(path.node)
        if (!trace || !t.isExpression(path.node.left)) return

        const leftId = path.scope.generateUidIdentifier(
          'algorithmVisualizerComparisonLeft'
        )
        const rightId = path.scope.generateUidIdentifier(
          'algorithmVisualizerComparisonRight'
        )
        const resultId = path.scope.generateUidIdentifier(
          'algorithmVisualizerComparisonResult'
        )
        declareComparisonTemporary(context, path, leftId)
        declareComparisonTemporary(context, path, rightId)
        declareComparisonTemporary(context, path, resultId)

        const description = t.binaryExpression(
          '+',
          t.stringLiteral(`Compare ${trace.source} -> `),
          resultId
        )
        const comparisonMetadata = t.objectExpression([
          t.objectProperty(
            t.identifier('comparison'),
            t.objectExpression([
              t.objectProperty(
                t.identifier('left'),
                createOperandMetadata(trace.leftExpression, leftId)
              ),
              t.objectProperty(
                t.identifier('operator'),
                t.stringLiteral(path.node.operator)
              ),
              t.objectProperty(
                t.identifier('right'),
                createOperandMetadata(trace.rightExpression, rightId)
              ),
              t.objectProperty(t.identifier('result'), resultId),
            ])
          ),
        ])
        const comparisonResult = context.markInstrumented(
          t.binaryExpression(path.node.operator, leftId, rightId)
        )
        const recordStep = createRecordStepStatement(
          STEP_TYPES.CONDITION,
          getLineNumber(path.node),
          description,
          context.createScopeProperties(),
          comparisonMetadata
        )
        const leftAssignment = context.markInstrumented(
          t.assignmentExpression('=', leftId, path.node.left)
        )
        const rightAssignment = context.markInstrumented(
          t.assignmentExpression('=', rightId, path.node.right)
        )
        const resultAssignment = context.markInstrumented(
          t.assignmentExpression('=', resultId, comparisonResult)
        )

        path.replaceWith(
          context.markInstrumented(
            t.sequenceExpression([
              leftAssignment,
              rightAssignment,
              resultAssignment,
              recordStep.expression,
              resultId,
            ])
          )
        )
      },
    },
  }
}
