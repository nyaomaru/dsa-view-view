import * as t from '@babel/types'

import {
  CLASS_RECEIVER_LABEL,
  FUNCTION_ARGUMENTS_LABEL,
  STEP_TYPES,
} from '@/entities/execution'
import { getUniqueNames } from './binding-names'
import { createRecordStepStatement } from './step-factory'

export class InstrumentationContext {
  private readonly scopeStack: string[][] = []
  private readonly functionStack: string[] = []
  private readonly classReceiverStack: boolean[] = []
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

  popScope(): void {
    this.scopeStack.pop()
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
    extraProperties: t.ObjectProperty[] = []
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
    ]
  }

  enterFunction(
    body: t.BlockStatement,
    functionName: string,
    line: number,
    description: string,
    parameterNames: string[],
    captureClassReceiver = false
  ): void {
    this.pushScope(parameterNames)
    this.classReceiverStack.push(captureClassReceiver)
    body.body.unshift(
      createRecordStepStatement(
        STEP_TYPES.FUNCTION_ENTRY,
        line,
        description,
        this.createScopeProperties([
          t.objectProperty(
            t.stringLiteral(FUNCTION_ARGUMENTS_LABEL),
            t.objectExpression(
              parameterNames.map((name) =>
                t.objectProperty(t.identifier(name), t.identifier(name))
              )
            )
          ),
        ])
      )
    )
    this.functionStack.push(functionName)
  }

  exitFunction(): void {
    this.functionStack.pop()
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
