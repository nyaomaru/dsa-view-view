import { parse, type ParserOptions } from '@babel/parser'
import type {
  Identifier,
  VariableDeclaration,
  VariableDeclarator,
  ArrowFunctionExpression,
  FunctionExpression,
  ClassDeclaration,
  Expression,
  Statement,
  TSTypeAnnotation,
  TypeAnnotation,
} from '@babel/types'

import {
  isPreparedTypeScriptClassName,
  type ClassMethodSignature,
  type FunctionParameter,
  type FunctionSignature,
} from '@/entities/code'
import {
  and,
  define,
  type Guard,
  hasKey,
  isObject,
  oneOfValues,
} from '@/shared/lib/guards'
import {
  isArrowFunctionVariableDeclaration,
  isArrowFunctionVariableDeclarator,
  isIdentifierNode,
  isNamedFunctionDeclaration,
  type NamedFunctionDeclaration,
} from './parser-guards'
import { DEFAULT_TYPE, getTypeFromAnnotation } from './type-parser'

const UNKNOWN_PARAMETER_NAME = 'unknown'

const PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
  plugins: ['typescript', 'estree'],
}

function getParameterFromIdentifier(id: Identifier): FunctionParameter {
  return {
    name: id.name,
    type: getTypeFromAnnotation(id.typeAnnotation),
    optional: id.optional ?? false,
  }
}

function getParameter(param: unknown): FunctionParameter {
  if (isIdentifierNode(param)) {
    return getParameterFromIdentifier(param)
  }

  return {
    name: UNKNOWN_PARAMETER_NAME,
    type: DEFAULT_TYPE,
    optional: false,
  }
}

function getParameters(params: readonly unknown[]): FunctionParameter[] {
  return params.map(getParameter)
}

function getSignatureFromFunctionDeclaration(
  funcNode: NamedFunctionDeclaration
): FunctionSignature {
  return {
    name: funcNode.id.name,
    parameters: getParameters(funcNode.params),
    returnType: getTypeFromAnnotation(funcNode.returnType),
  }
}

function getSignatureFromArrowFunction(
  name: string,
  arrowFunc: ArrowFunctionExpression
): FunctionSignature {
  return {
    name,
    parameters: getParameters(arrowFunc.params),
    returnType: getTypeFromAnnotation(arrowFunc.returnType),
  }
}

function getSignatureFromFunctionExpression(
  name: string,
  func: FunctionExpression
): FunctionSignature {
  return {
    name,
    parameters: getParameters(func.params),
    returnType: getTypeFromAnnotation(func.returnType),
  }
}

function getReturnedFunction(
  body: ArrowFunctionExpression['body'] | FunctionExpression['body']
): ArrowFunctionExpression | FunctionExpression | null {
  if (
    body.type === 'ArrowFunctionExpression' ||
    body.type === 'FunctionExpression'
  ) {
    return body
  }

  if (body.type !== 'BlockStatement') {
    return null
  }

  const returnStatement = body.body.find(
    (statement): statement is Statement & { argument: Expression } =>
      statement.type === 'ReturnStatement' &&
      Boolean(statement.argument) &&
      (statement.argument?.type === 'ArrowFunctionExpression' ||
        statement.argument?.type === 'FunctionExpression')
  )

  if (
    returnStatement?.argument.type === 'ArrowFunctionExpression' ||
    returnStatement?.argument.type === 'FunctionExpression'
  ) {
    return returnStatement.argument
  }

  return null
}

function getHigherOrderSignature(
  name: string,
  func: ArrowFunctionExpression | FunctionExpression
): FunctionSignature | null {
  const returnedFunction = getReturnedFunction(func.body)
  if (!returnedFunction) return null

  return {
    name,
    parameters: getParameters(returnedFunction.params),
    returnType: getTypeFromAnnotation(returnedFunction.returnType),
  }
}

function getFunctionLikeVariableDeclarator(declaration: VariableDeclaration):
  | (VariableDeclarator & {
      id: Identifier
      init: ArrowFunctionExpression | FunctionExpression
    })
  | null {
  const declarator = declaration.declarations.find(
    (
      item
    ): item is VariableDeclarator & {
      id: Identifier
      init: ArrowFunctionExpression | FunctionExpression
    } =>
      item.id.type === 'Identifier' &&
      Boolean(item.init) &&
      (item.init?.type === 'ArrowFunctionExpression' ||
        item.init?.type === 'FunctionExpression')
  )

  return declarator ?? null
}

function getSignatureFromVariableDeclaration(
  varNode: VariableDeclaration
): FunctionSignature | null {
  const functionLikeDeclaration = getFunctionLikeVariableDeclarator(varNode)
  if (functionLikeDeclaration) {
    const higherOrderSignature = getHigherOrderSignature(
      functionLikeDeclaration.id.name,
      functionLikeDeclaration.init
    )
    if (higherOrderSignature) return higherOrderSignature

    if (functionLikeDeclaration.init.type === 'FunctionExpression') {
      return getSignatureFromFunctionExpression(
        functionLikeDeclaration.id.name,
        functionLikeDeclaration.init
      )
    }
  }

  const declaration = varNode.declarations.find(
    isArrowFunctionVariableDeclarator
  )
  if (declaration) {
    return getSignatureFromArrowFunction(declaration.id.name, declaration.init)
  }

  return null
}

function getHigherOrderSignatureFromVariableDeclaration(
  varNode: VariableDeclaration
): FunctionSignature | null {
  const functionLikeDeclaration = getFunctionLikeVariableDeclarator(varNode)
  return functionLikeDeclaration
    ? getHigherOrderSignature(
        functionLikeDeclaration.id.name,
        functionLikeDeclaration.init
      )
    : null
}

/**
 * Parser node shape shared by class methods, object methods, and properties.
 */
type MethodLikeNode = {
  /** Babel node type. */
  type: string
  /** Method kind such as constructor or method. */
  kind?: string
  /** Optional TypeScript accessibility modifier. */
  accessibility?: string | null
  /** Optional method key node. */
  key?: {
    /** Babel node type for the key. */
    type: string
    /** Identifier name for identifier keys. */
    name?: string
  }
  /** Method parameter nodes. */
  params?: readonly unknown[]
  /** Property value for object-property style methods. */
  value?: {
    /** Parameter nodes stored on the property value. */
    params?: readonly unknown[]
    /** Return type annotation stored on the property value. */
    returnType?: TSTypeAnnotation | TypeAnnotation | null
  }
  /** Return type annotation stored directly on the method. */
  returnType?: TSTypeAnnotation | TypeAnnotation | null
}

const isMethodNodeType = oneOfValues('ClassMethod', 'MethodDefinition')
const hasType = hasKey('type')
const isMethodLikeNode: Guard<MethodLikeNode> = and(
  isObject,
  define<MethodLikeNode>(
    (value) => hasType(value) && isMethodNodeType(value.type)
  )
)

function getClassMethodSignature(
  method: MethodLikeNode
): ClassMethodSignature | null {
  if (method.kind !== 'method' || method.accessibility === 'private') {
    return null
  }

  if (method.key?.type !== 'Identifier' || !method.key.name) {
    return null
  }

  return {
    name: method.key.name,
    parameters: getParameters(method.params ?? method.value?.params ?? []),
    returnType: getTypeFromAnnotation(
      method.returnType ?? method.value?.returnType
    ),
  }
}

function getSignatureFromClassDeclaration(
  classNode: ClassDeclaration
): FunctionSignature | null {
  if (!classNode.id?.name) return null

  const members = (classNode.body.body as unknown[]).filter(isMethodLikeNode)
  const constructorMethod = members.find(
    (member) => member.kind === 'constructor'
  )
  const methods = members
    .map(getClassMethodSignature)
    .filter((method): method is ClassMethodSignature => method !== null)

  return {
    kind: 'class',
    name: classNode.id.name,
    parameters: constructorMethod
      ? getParameters(
          constructorMethod.params ?? constructorMethod.value?.params ?? []
        )
      : [],
    returnType: classNode.id.name,
    methods,
  }
}

function shouldPreferClassSignature(
  candidate: FunctionSignature,
  current: FunctionSignature | null
): boolean {
  if (!current) return true

  const candidateIsPrepared = isPreparedTypeScriptClassName(candidate.name)
  const currentIsPrepared = isPreparedTypeScriptClassName(current.name)

  if (candidateIsPrepared !== currentIsPrepared) {
    return currentIsPrepared
  }

  return (candidate.methods?.length ?? 0) > (current.methods?.length ?? 0)
}

/**
 * Extracts a function signature from TypeScript/JavaScript code.
 */
export function extractTypeScriptFunctionSignature(
  code: string
): FunctionSignature | null {
  try {
    const ast = parse(code, PARSER_OPTIONS)
    let classSignature: FunctionSignature | null = null

    for (const node of ast.program.body) {
      if (node.type === 'VariableDeclaration') {
        const signature = getHigherOrderSignatureFromVariableDeclaration(node)
        if (signature) return signature
      }
    }

    for (const node of ast.program.body) {
      if (isNamedFunctionDeclaration(node)) {
        return getSignatureFromFunctionDeclaration(node)
      }

      if (isArrowFunctionVariableDeclaration(node)) {
        const signature = getSignatureFromVariableDeclaration(node)
        if (signature) return signature
      }

      if (node.type === 'ClassDeclaration') {
        const signature = getSignatureFromClassDeclaration(node)
        if (
          signature &&
          shouldPreferClassSignature(signature, classSignature)
        ) {
          classSignature = signature
        }
      }
    }

    return classSignature
  } catch (error) {
    console.error('Failed to parse function signature:', error)
    return null
  }
}
