import { parse } from '@babel/parser'
import type { InputValues } from '@/entities/execution'
import { hasKeys, isArray, isNil, isObject } from '@/shared/lib/guards'

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

function getEntryFunction(code: string, entryFunctionName?: string): unknown {
  if (!entryFunctionName) return null

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    for (const node of ast.program.body) {
      if (
        node.type === 'FunctionDeclaration' &&
        node.id?.name === entryFunctionName
      ) {
        return node
      }

      if (node.type !== 'VariableDeclaration') continue

      const declarator = node.declarations.find(
        (item) =>
          item.id.type === 'Identifier' &&
          item.id.name === entryFunctionName &&
          item.init &&
          (item.init.type === 'ArrowFunctionExpression' ||
            item.init.type === 'FunctionExpression')
      )
      if (declarator?.init) return declarator.init
    }
  } catch {
    return null
  }

  return null
}

function isVoidTypeAnnotation(returnType: unknown): boolean {
  if (!isObject(returnType) || !hasTypeKey(returnType)) return false
  if (returnType.type === 'TSVoidKeyword') return true
  if (
    returnType.type !== 'TSTypeReference' ||
    !hasKeys('typeName')(returnType) ||
    !isObject(returnType.typeName) ||
    !hasTypeKey(returnType.typeName) ||
    returnType.typeName.type !== 'Identifier' ||
    !hasNameKey(returnType.typeName)
  ) {
    return false
  }

  const completionTypeIndex =
    returnType.typeName.name === 'Promise'
      ? 0
      : returnType.typeName.name === 'Generator' ||
          returnType.typeName.name === 'AsyncGenerator'
        ? 1
        : -1
  if (completionTypeIndex === -1) return false

  const typeArguments = hasKeys('typeArguments')(returnType)
    ? returnType.typeArguments
    : null
  return (
    isObject(typeArguments) &&
    hasKeys('params')(typeArguments) &&
    isArray(typeArguments.params) &&
    isObject(typeArguments.params[completionTypeIndex]) &&
    hasTypeKey(typeArguments.params[completionTypeIndex]) &&
    typeArguments.params[completionTypeIndex].type === 'TSVoidKeyword'
  )
}

function hasValueBearingReturn(node: unknown): boolean {
  if (isArray(node)) return node.some(hasValueBearingReturn)
  if (!isObject(node)) return false

  if (hasTypeKey(node)) {
    if (node.type === 'ReturnStatement') {
      return hasArgumentKey(node) && !isNil(node.argument)
    }

    if (
      node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ObjectMethod' ||
      node.type === 'ClassMethod' ||
      node.type === 'ClassPrivateMethod'
    ) {
      return false
    }
  }

  return Object.values(node).some(hasValueBearingReturn)
}

function hasValueBearingFunctionResult(functionNode: unknown): boolean {
  if (
    !isObject(functionNode) ||
    !hasTypeKey(functionNode) ||
    !hasKeys('body')(functionNode)
  ) {
    return false
  }

  const functionBody = functionNode.body

  if (
    functionNode.type === 'ArrowFunctionExpression' &&
    (!isObject(functionBody) ||
      !hasTypeKey(functionBody) ||
      functionBody.type !== 'BlockStatement')
  ) {
    return !(
      isObject(functionBody) &&
      hasTypeKey(functionBody) &&
      functionBody.type === 'UnaryExpression' &&
      hasKeys('operator')(functionBody) &&
      functionBody.operator === 'void'
    )
  }

  return hasValueBearingReturn(functionBody)
}

/** Returns whether the selected entry point is typed or inferred to return void. */
export function isVoidEntryFunction(
  code: string,
  entryFunctionName?: string
): boolean {
  const entryFunction = getEntryFunction(code, entryFunctionName)
  const returnedFunction =
    isObject(entryFunction) &&
    hasKeys('body')(entryFunction) &&
    isObject(entryFunction.body)
      ? getReturnedFunction(entryFunction.body)
      : null
  const invokedFunction = returnedFunction ?? entryFunction
  if (!isObject(invokedFunction)) return false

  if (
    hasKeys('returnType')(invokedFunction) &&
    !isNil(invokedFunction.returnType)
  ) {
    return (
      isObject(invokedFunction.returnType) &&
      hasKeys('typeAnnotation')(invokedFunction.returnType) &&
      isVoidTypeAnnotation(invokedFunction.returnType.typeAnnotation)
    )
  }

  return (
    hasKeys('body')(invokedFunction) &&
    !hasValueBearingFunctionResult(invokedFunction)
  )
}

function getParamNames(params: readonly unknown[]): string[] {
  return params.flatMap((param) =>
    isObject(param) &&
    hasTypeKey(param) &&
    param.type === 'Identifier' &&
    hasNameKey(param)
      ? [String(param.name)]
      : []
  )
}

function getReturnedFunction(body: unknown): unknown {
  if (!isObject(body) || !hasTypeKey(body)) return null

  if (
    body.type === 'ArrowFunctionExpression' ||
    body.type === 'FunctionExpression'
  ) {
    return body
  }

  if (
    body.type !== 'BlockStatement' ||
    !hasKeys('body')(body) ||
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
  const entryFunction = getEntryFunction(code, entryFunctionName)
  if (
    !isObject(entryFunction) ||
    !hasKeys('params', 'body')(entryFunction) ||
    !isArray(entryFunction.params) ||
    !isObject(entryFunction.body) ||
    !hasTypeKey(entryFunction.body) ||
    !getReturnedFunction(entryFunction.body)
  ) {
    return null
  }

  return { outerParamNames: getParamNames(entryFunction.params) }
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
