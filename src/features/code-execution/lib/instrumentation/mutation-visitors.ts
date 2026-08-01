import { type NodePath } from '@babel/traverse'
import * as t from '@babel/types'

import { STEP_TYPES } from '@/entities/execution'
import { MUTATING_ARRAY_METHODS } from './array-methods'
import { getLineNumber, getMemberPropertyName, safeGenerate } from './ast-utils'
import { collectBindingNames } from './binding-names'
import { InstrumentationContext } from './context'
import { createRecordStepCall, createRecordStepStatement } from './step-factory'

const getInitializerDescription = (
  initializer: t.Expression | null | undefined
): string => {
  if (!initializer) return 'undefined'
  if (
    t.isFunctionExpression(initializer) ||
    t.isArrowFunctionExpression(initializer)
  ) {
    return 'function'
  }
  return safeGenerate(initializer)
}

const shouldSkipVariableDeclarationStep = (
  path: NodePath<t.VariableDeclaration>
): boolean =>
  (path.parentPath.isForStatement() && path.key === 'init') ||
  ((path.parentPath.isForOfStatement() || path.parentPath.isForInStatement()) &&
    path.key === 'left')

const getAssignmentTargetName = (
  target: t.AssignmentExpression['left']
): string => {
  if (t.isIdentifier(target)) return target.name
  if (t.isMemberExpression(target)) return safeGenerate(target)
  return ''
}

const getArrayMutationTargetName = (
  target: t.MemberExpression['object'] | null
): string => {
  if (target && t.isIdentifier(target)) return target.name
  if (target && t.isMemberExpression(target)) return safeGenerate(target, '')
  return ''
}

type AssignmentTrace = { descriptionPrefix: string }

type ArrayMutationTrace = { description: string }

function hasAwaitExpression(path: NodePath): boolean {
  let hasAwait = false

  path.traverse({
    Function(functionPath) {
      functionPath.skip()
    },
    AwaitExpression(awaitPath) {
      hasAwait = true
      awaitPath.stop()
    },
  })

  return hasAwait
}

export const createMutationVisitors = (context: InstrumentationContext) => {
  const initializerDescriptions = new WeakMap<t.VariableDeclaration, string>()
  const assignmentTraces = new WeakMap<
    t.AssignmentExpression,
    AssignmentTrace
  >()
  const arrayMutationTraces = new WeakMap<
    t.CallExpression,
    ArrayMutationTrace
  >()

  return {
    VariableDeclaration: {
      enter(path: NodePath<t.VariableDeclaration>) {
        if (context.isInstrumented(path.node)) return

        const lastDeclaration = path.node.declarations.at(-1)
        if (lastDeclaration) {
          initializerDescriptions.set(
            path.node,
            getInitializerDescription(lastDeclaration.init)
          )
        }
      },
      exit(path: NodePath<t.VariableDeclaration>) {
        if (
          context.isInstrumented(path.node) ||
          shouldSkipVariableDeclarationStep(path)
        ) {
          return
        }

        context.addVariablesToCurrentScope(
          path.node.declarations.flatMap((declarator) =>
            collectBindingNames(declarator.id)
          )
        )

        path.node.declarations.forEach((declarator, index) => {
          if (
            !t.isIdentifier(declarator.id) ||
            index !== path.node.declarations.length - 1
          ) {
            return
          }

          const variableName = declarator.id.name
          const initializerDescription =
            initializerDescriptions.get(path.node) ??
            getInitializerDescription(declarator.init)
          path.insertAfter(
            createRecordStepStatement(
              STEP_TYPES.VARIABLE_DECLARATION,
              getLineNumber(declarator),
              `${path.node.kind} ${variableName} = ${initializerDescription}`,
              context.createScopeProperties([
                t.objectProperty(
                  t.identifier(variableName),
                  t.identifier(variableName)
                ),
              ])
            )
          )
        })

        context.markInstrumented(path.node)
      },
    },

    AssignmentExpression: {
      enter(path: NodePath<t.AssignmentExpression>) {
        if (context.isInstrumented(path.node)) return

        const variableName = getAssignmentTargetName(path.node.left)
        if (!variableName) return

        assignmentTraces.set(path.node, {
          descriptionPrefix: `${variableName} ${path.node.operator} ${safeGenerate(path.node.right)} -> `,
        })
      },
      exit(path: NodePath<t.AssignmentExpression>) {
        if (context.isInstrumented(path.node)) return

        const trace = assignmentTraces.get(path.node)
        if (!trace) return
        const isAsyncAssignment = hasAwaitExpression(path)

        const resultId = path.scope.generateUidIdentifier(
          'algorithmVisualizerAssignmentResult'
        )
        const resultDeclaration = context.markInstrumented(
          t.variableDeclaration('const', [
            t.variableDeclarator(resultId, context.markInstrumented(path.node)),
          ])
        )
        const description = t.templateLiteral(
          [
            t.templateElement({
              raw: trace.descriptionPrefix,
              cooked: trace.descriptionPrefix,
            }),
            t.templateElement({ raw: '', cooked: '' }, true),
          ],
          [t.identifier(resultId.name)]
        )
        const syntheticArrow = context.markInstrumented(
          t.arrowFunctionExpression(
            [],
            t.blockStatement([
              resultDeclaration,
              createRecordStepStatement(
                STEP_TYPES.ASSIGNMENT,
                getLineNumber(path.node),
                description,
                context.createScopeProperties()
              ),
              context.markInstrumented(
                t.returnStatement(t.identifier(resultId.name))
              ),
            ]),
            isAsyncAssignment
          )
        )

        const invocation = context.markInstrumented(
          t.callExpression(syntheticArrow, [])
        )
        path.replaceWith(
          isAsyncAssignment
            ? context.markInstrumented(t.awaitExpression(invocation))
            : invocation
        )
      },
    },

    UpdateExpression(path: NodePath<t.UpdateExpression>) {
      if (
        context.isInstrumented(path.node) ||
        !t.isIdentifier(path.node.argument) ||
        (path.parentPath.isForStatement() && path.key === 'update')
      ) {
        return
      }

      const { operator, prefix } = path.node
      const variableName = path.node.argument.name
      const isStandaloneStatement = path.parentPath.isExpressionStatement()
      if (!isStandaloneStatement && !prefix) return

      path.replaceWith(
        context.markInstrumented(
          t.sequenceExpression([
            context.markInstrumented(path.node),
            createRecordStepCall(
              STEP_TYPES.ASSIGNMENT,
              getLineNumber(path.node),
              `${prefix ? operator : ''}${variableName}${prefix ? '' : operator}`,
              context.createScopeProperties()
            ),
            t.identifier(variableName),
          ])
        )
      )
    },

    CallExpression: {
      enter(path: NodePath<t.CallExpression>) {
        if (context.isInstrumented(path.node)) return

        const methodName = getMemberPropertyName(path.node.callee)
        if (!methodName || !MUTATING_ARRAY_METHODS.has(methodName)) return

        const calleeObject = t.isMemberExpression(path.node.callee)
          ? path.node.callee.object
          : null
        const arrayName = getArrayMutationTargetName(calleeObject)
        if (!arrayName) return

        const argumentsCode = path.node.arguments
          .map((argument) => safeGenerate(argument))
          .join(', ')
        arrayMutationTraces.set(path.node, {
          description: `${arrayName}.${methodName}(${argumentsCode})`,
        })
      },
      exit(path: NodePath<t.CallExpression>) {
        if (context.isInstrumented(path.node)) return

        const trace = arrayMutationTraces.get(path.node)
        if (!trace) return

        if (!path.parentPath.isExpressionStatement()) {
          const isAsyncMutation = hasAwaitExpression(path)
          const resultId = path.scope.generateUidIdentifier(
            'algorithmVisualizerMutationResult'
          )
          const syntheticArrow = context.markInstrumented(
            t.arrowFunctionExpression(
              [],
              t.blockStatement([
                context.markInstrumented(
                  t.variableDeclaration('const', [
                    t.variableDeclarator(
                      resultId,
                      context.markInstrumented(path.node)
                    ),
                  ])
                ),
                createRecordStepStatement(
                  STEP_TYPES.ARRAY_MUTATION,
                  getLineNumber(path.node),
                  trace.description,
                  context.createScopeProperties()
                ),
                context.markInstrumented(
                  t.returnStatement(t.identifier(resultId.name))
                ),
              ]),
              isAsyncMutation
            )
          )

          const invocation = context.markInstrumented(
            t.callExpression(syntheticArrow, [])
          )
          path.replaceWith(
            isAsyncMutation
              ? context.markInstrumented(t.awaitExpression(invocation))
              : invocation
          )
          return
        }

        path.replaceWith(
          context.markInstrumented(
            t.sequenceExpression([
              context.markInstrumented(path.node),
              createRecordStepCall(
                STEP_TYPES.ARRAY_MUTATION,
                getLineNumber(path.node),
                trace.description,
                context.createScopeProperties()
              ),
            ])
          )
        )
      },
    },
  }
}
