import { parse } from '@babel/parser'
import type { InputValues } from '@/entities/execution'
import { hasKeys, isArray, isObject } from '@/shared/lib/guards'

import {
  CLASS_DESIGN_INPUT_KEY,
  isClassDesignInput,
} from './class-design-input'

/**
 * Metadata for functions that return another function and need two-stage
 * invocation in the execution wrapper.
 */
type HigherOrderEntryMetadata = {
  /** Parameter names from the outer function. */
  outerParamNames: string[]
}

/**
 * Generated execution function invoked with user inputs followed by recordStep.
 */
type ExecutionFunction = (
  ...args: [...inputValues: unknown[], recordStep: unknown]
) => unknown

const hasTypeKey = hasKeys('type')
const hasArgumentKey = hasKeys('argument')
const hasNameKey = hasKeys('name')

function getParamNames(params: unknown[]): string[] {
  return params.flatMap((param) =>
    isObject(param) &&
    hasTypeKey(param) &&
    param.type === 'Identifier' &&
    hasNameKey(param)
      ? [String(param.name)]
      : []
  )
}

function getReturnedFunction(
  body: { type: string; body?: unknown[] } | { type: string }
): unknown {
  if (
    body.type === 'ArrowFunctionExpression' ||
    body.type === 'FunctionExpression'
  ) {
    return body
  }

  if (
    body.type !== 'BlockStatement' ||
    !('body' in body) ||
    !isArray(body.body)
  ) {
    return null
  }

  const returnStatement = body.body.find(
    (statement) =>
      isObject(statement) &&
      hasTypeKey(statement) &&
      statement.type === 'ReturnStatement' &&
      hasArgumentKey(statement) &&
      statement.argument &&
      isObject(statement.argument) &&
      hasTypeKey(statement.argument) &&
      (statement.argument.type === 'ArrowFunctionExpression' ||
        statement.argument.type === 'FunctionExpression')
  )

  return isObject(returnStatement) && hasArgumentKey(returnStatement)
    ? returnStatement.argument
    : null
}

function getHigherOrderEntryMetadata(
  code: string,
  entryFunctionName?: string
): HigherOrderEntryMetadata | null {
  if (!entryFunctionName) return null

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    for (const node of ast.program.body) {
      if (
        node.type === 'FunctionDeclaration' &&
        node.id?.name === entryFunctionName &&
        getReturnedFunction(node.body)
      ) {
        return { outerParamNames: getParamNames(node.params) }
      }

      if (node.type !== 'VariableDeclaration') continue

      const declarator = node.declarations.find(
        (item) =>
          item.id.type === 'Identifier' &&
          item.id.name === entryFunctionName &&
          item.init &&
          (item.init.type === 'ArrowFunctionExpression' ||
            item.init.type === 'FunctionExpression') &&
          getReturnedFunction(item.init.body)
      )

      if (
        declarator?.init &&
        (declarator.init.type === 'ArrowFunctionExpression' ||
          declarator.init.type === 'FunctionExpression')
      ) {
        return { outerParamNames: getParamNames(declarator.init.params) }
      }
    }
  } catch {
    return null
  }

  return null
}

function buildClassDesignWrapperCode(
  executableCode: string,
  className: string
): string {
  return `
    ${executableCode}
    const __AlgorithmVisualizerClass = ${className};
    const __AlgorithmVisualizerInstance = new __AlgorithmVisualizerClass(...${CLASS_DESIGN_INPUT_KEY}.args[0]);
    const __AlgorithmVisualizerOutput = [null];
    for (let i = 1; i < ${CLASS_DESIGN_INPUT_KEY}.operations.length; i += 1) {
      const operation = ${CLASS_DESIGN_INPUT_KEY}.operations[i];
      const args = ${CLASS_DESIGN_INPUT_KEY}.args[i] || [];
      const result = __AlgorithmVisualizerInstance[operation](...args);
      __AlgorithmVisualizerOutput.push(result === undefined ? null : result);
    }
    return __AlgorithmVisualizerOutput;
  `
}

function buildHigherOrderWrapperCode(
  executableCode: string,
  entryFunctionName: string,
  outerParamNames: string[]
): string {
  const outerArgs = outerParamNames
    .map((name) => `typeof ${name} !== "undefined" ? ${name} : undefined`)
    .join(', ')

  return `
    ${executableCode}
    const __AlgorithmVisualizerReturnedFunction = ${entryFunctionName}(${outerArgs});
    return typeof __AlgorithmVisualizerReturnedFunction === "function"
      ? __AlgorithmVisualizerReturnedFunction(...arguments)
      : __AlgorithmVisualizerReturnedFunction;
  `
}

function buildEntryFunctionWrapperCode(
  executableCode: string,
  entryFunctionName: string
): string {
  return `
    ${executableCode}
    const __AlgorithmVisualizerResult = ${entryFunctionName}(...arguments);
    return typeof __AlgorithmVisualizerResult === "function"
      ? __AlgorithmVisualizerResult()
      : __AlgorithmVisualizerResult;
  `
}

/**
 * Builds JavaScript wrapper code that invokes the selected user entry point.
 */
export function buildExecutionWrapperCode(
  executableCode: string,
  userCode: string,
  inputs: InputValues,
  entryFunctionName?: string
): string {
  const classDesignInput = inputs[CLASS_DESIGN_INPUT_KEY]
  if (isClassDesignInput(classDesignInput)) {
    return buildClassDesignWrapperCode(
      executableCode,
      classDesignInput.className
    )
  }

  if (!entryFunctionName) {
    return executableCode
  }

  const higherOrderEntry = getHigherOrderEntryMetadata(
    userCode,
    entryFunctionName
  )
  if (higherOrderEntry) {
    return buildHigherOrderWrapperCode(
      executableCode,
      entryFunctionName,
      higherOrderEntry.outerParamNames
    )
  }

  return buildEntryFunctionWrapperCode(executableCode, entryFunctionName)
}

/**
 * Creates an executable function from generated wrapper code and input names.
 */
export function createExecutionFunction(
  inputNames: string[],
  wrapperCode: string
): ExecutionFunction {
  // oxlint-disable-next-line no-implied-eval -- User algorithms run in an isolated generated function with instrumented inputs.
  return new Function(
    ...inputNames,
    'recordStep',
    wrapperCode
  ) as ExecutionFunction
}
