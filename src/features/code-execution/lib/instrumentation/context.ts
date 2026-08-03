import * as t from '@babel/types'

import {
  CLASS_RECEIVER_LABEL,
  FUNCTION_ARGUMENTS_LABEL,
  FUNCTION_NAME_LABEL,
  STEP_TYPES,
} from '@/entities/execution'
import { getUniqueNames } from './binding-names'
import { CALL_FRAME_ID_LABEL } from '../frame-identity'
import { createRecordStepCall } from './step-factory'

export class InstrumentationContext {
  private readonly scopeStack: string[][] = []
  private readonly functionStack: string[] = []
  private readonly classReceiverStack: boolean[] = []
  private readonly frameIdentifierStack: t.Identifier[] = []
  private readonly instrumentedNodes = new WeakSet<t.Node>()

  isInstrumented(node: t.Node): boolean {
    return this.instrumentedNodes.has(node)
  }

  markInstrumented<T extends t.Node>(node: T): T {
    this.instrumentedNodes.add(node)
    return node
  }

  pushScope(names: string[] = []): void {
    this.scopeStack.push([...getUniqueNames(names)])
  }

  popScope(preserveVariablesInParent = false): void {
    const variables = this.scopeStack.pop()

    if (preserveVariablesInParent && variables) {
      this.addVariablesToCurrentScope(variables)
    }
  }

  addVariablesToCurrentScope(names: string[]): void {
    const uniqueNames = getUniqueNames(names)
    if (uniqueNames.length === 0) return

    if (this.scopeStack.length === 0) {
      this.scopeStack.push([...uniqueNames])
      return
    }

    this.scopeStack[this.scopeStack.length - 1].push(...uniqueNames)
  }

  createScopeProperties(
    extraProperties: t.ObjectProperty[] = [],
    includeFrameIdentity = true
  ): t.ObjectProperty[] {
    const visibleVariables = getUniqueNames(this.scopeStack.flat())
    return [
      ...visibleVariables.map((name) =>
        t.objectProperty(t.identifier(name), t.identifier(name))
      ),
      ...extraProperties,
      ...(this.shouldCaptureClassReceiver()
        ? [
            t.objectProperty(
              t.stringLiteral(CLASS_RECEIVER_LABEL),
              t.thisExpression()
            ),
          ]
        : []),
      ...(includeFrameIdentity ? this.createFrameIdentityProperties() : []),
    ]
  }

  createFrameIdentityProperties(): t.ObjectProperty[] {
    const frameIdentifier = this.frameIdentifierStack.at(-1)
    if (!frameIdentifier) return []

    return [
      t.objectProperty(
        t.stringLiteral(CALL_FRAME_ID_LABEL),
        t.identifier(frameIdentifier.name)
      ),
    ]
  }

  enterFunction(
    body: t.BlockStatement,
    functionName: string,
    line: number,
    description: string,
    parameterNames: string[],
    frameIdentifier: t.Identifier,
    captureClassReceiver = false
  ): void {
    this.pushScope(parameterNames)
    this.classReceiverStack.push(captureClassReceiver)
    const entryStep = createRecordStepCall(
      STEP_TYPES.FUNCTION_ENTRY,
      line,
      description,
      this.createScopeProperties(
        [
          t.objectProperty(
            t.stringLiteral(FUNCTION_NAME_LABEL),
            t.stringLiteral(functionName)
          ),
          t.objectProperty(
            t.stringLiteral(FUNCTION_ARGUMENTS_LABEL),
            t.objectExpression(
              parameterNames.map((name) =>
                t.objectProperty(t.identifier(name), t.identifier(name))
              )
            )
          ),
        ],
        false
      )
    )
    const frameId = t.memberExpression(
      t.memberExpression(
        t.memberExpression(entryStep, t.identifier('metadata')),
        t.identifier('callFrame')
      ),
      t.identifier('frameId')
    )
    body.body.unshift(
      this.markInstrumented(
        t.variableDeclaration('const', [
          t.variableDeclarator(frameIdentifier, frameId),
        ])
      )
    )
    this.frameIdentifierStack.push(frameIdentifier)
    this.functionStack.push(functionName)
  }

  exitFunction(): void {
    this.functionStack.pop()
    this.frameIdentifierStack.pop()
    this.classReceiverStack.pop()
    this.popScope()
  }

  shouldCaptureClassReceiver(): boolean {
    return this.classReceiverStack[this.classReceiverStack.length - 1] ?? false
  }

  getCurrentFunctionName(): string {
    return (
      this.functionStack[this.functionStack.length - 1] ?? 'current function'
    )
  }
}
