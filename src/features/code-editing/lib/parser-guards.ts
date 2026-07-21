import {
  isArrowFunctionExpression as isBabelArrowFunctionExpression,
  isFunctionDeclaration as isBabelFunctionDeclaration,
  isIdentifier as isBabelIdentifier,
  isTSArrayType as isBabelTSArrayType,
  isTSParenthesizedType as isBabelTSParenthesizedType,
  isTSTypeAnnotation as isBabelTSTypeAnnotation,
  isTSTypeReference as isBabelTSTypeReference,
  isTSUnionType as isBabelTSUnionType,
  isVariableDeclaration as isBabelVariableDeclaration,
  isVariableDeclarator as isBabelVariableDeclarator,
} from '@babel/types'
import type {
  ArrowFunctionExpression,
  FunctionDeclaration,
  Identifier,
  Node,
  TSArrayType,
  TSParenthesizedType,
  TSTypeAnnotation,
  TSTypeParameterInstantiation,
  TSTypeReference,
  TSUnionType,
  VariableDeclaration,
  VariableDeclarator,
} from '@babel/types'
import {
  and,
  define,
  equals,
  oneOfValues,
  predicateToRefine,
  type Guard,
} from '@/shared/lib/guards'

const isListNodeTypeName = equals('ListNode')
const isTreeNodeTypeName = equals('TreeNode')
const isGraphNodeTypeName = oneOfValues('_Node', 'GraphNode')
const isArrayTypeName = oneOfValues('Array', 'ReadonlyArray')

/**
 * Function declaration with a guaranteed identifier.
 */
export type NamedFunctionDeclaration = FunctionDeclaration & {
  /** Function identifier. */
  id: Identifier
}

/**
 * TypeScript type reference whose type name is a plain identifier.
 */
export type TreeNodeTypeReference = TSTypeReference & {
  /** Referenced type name. */
  typeName: Identifier
}

/**
 * Array or ReadonlyArray type reference with one element type argument.
 */
export type ArrayTypeReference = TSTypeReference & {
  /** Referenced Array type name. */
  typeName: Identifier
  /** Single array element type. */
  typeArguments: TSTypeParameterInstantiation
}

/**
 * Variable declarator for arrow functions assigned to identifiers.
 */
export type ArrowFunctionVariableDeclarator = VariableDeclarator & {
  /** Variable identifier. */
  id: Identifier
  /** Arrow function initializer. */
  init: ArrowFunctionExpression
}

type NamedVariableDeclarator = VariableDeclarator & {
  id: Identifier
}

export const isIdentifierNode = define<Identifier>((value) =>
  isBabelIdentifier(value as Node | null | undefined)
)

const isFunctionDeclarationNode = define<FunctionDeclaration>((value) =>
  isBabelFunctionDeclaration(value as Node | null | undefined)
)

const isVariableDeclarationNode = define<VariableDeclaration>((value) =>
  isBabelVariableDeclaration(value as Node | null | undefined)
)

const isVariableDeclaratorNode = define<VariableDeclarator>((value) =>
  isBabelVariableDeclarator(value as Node | null | undefined)
)

export const isArrowFunctionExpressionNode = define<ArrowFunctionExpression>(
  (value) => isBabelArrowFunctionExpression(value as Node | null | undefined)
)

export const isTSArrayTypeNode = define<TSArrayType>(
  (value): value is TSArrayType =>
    isBabelTSArrayType(value as Node | null | undefined)
)

const isTSTypeReferenceNode = define<TSTypeReference>(
  (value): value is TSTypeReference =>
    isBabelTSTypeReference(value as Node | null | undefined)
)

const hasIdentifierTypeName = (
  value: TSTypeReference
): value is TreeNodeTypeReference => isIdentifierNode(value.typeName)

const isNamedTypeReferenceNode = and(
  isTSTypeReferenceNode,
  hasIdentifierTypeName
)

const hasTypeName = (isTypeName: Guard<string>) =>
  predicateToRefine<TreeNodeTypeReference>((value) =>
    isTypeName(value.typeName.name)
  )

const isArrayNamedTypeReference = and(
  isNamedTypeReferenceNode,
  hasTypeName(isArrayTypeName)
)

const hasSingleTypeArgument = (
  value: TreeNodeTypeReference
): value is ArrayTypeReference => value.typeArguments?.params.length === 1

export const isArrayTypeReference = and(
  isArrayNamedTypeReference,
  hasSingleTypeArgument
)

export const isTSUnionTypeNode = define<TSUnionType>((value) =>
  isBabelTSUnionType(value as Node | null | undefined)
)

export const isTSParenthesizedTypeNode = define<TSParenthesizedType>((value) =>
  isBabelTSParenthesizedType(value as Node | null | undefined)
)

export const isTypeAnnotationNode = define<TSTypeAnnotation>((value) =>
  isBabelTSTypeAnnotation(value as Node | null | undefined)
)

export const isTreeNodeTypeReference = and(
  isNamedTypeReferenceNode,
  hasTypeName(isTreeNodeTypeName)
)

export const isListNodeTypeReference = and(
  isNamedTypeReferenceNode,
  hasTypeName(isListNodeTypeName)
)

export const isGraphNodeTypeReference = and(
  isNamedTypeReferenceNode,
  hasTypeName(isGraphNodeTypeName)
)

const hasFunctionName = (
  value: FunctionDeclaration
): value is NamedFunctionDeclaration => isIdentifierNode(value.id)

export const isNamedFunctionDeclaration = and(
  isFunctionDeclarationNode,
  hasFunctionName
)

const hasVariableName = (
  value: VariableDeclarator
): value is NamedVariableDeclarator => isIdentifierNode(value.id)

const isNamedVariableDeclarator = and(
  isVariableDeclaratorNode,
  hasVariableName
)

const hasArrowFunctionInitializer = (
  value: NamedVariableDeclarator
): value is ArrowFunctionVariableDeclarator =>
  isArrowFunctionExpressionNode(value.init)

export const isArrowFunctionVariableDeclarator = and(
  isNamedVariableDeclarator,
  hasArrowFunctionInitializer
)

export const isArrowFunctionVariableDeclaration = and(
  isVariableDeclarationNode,
  predicateToRefine<VariableDeclaration>((value) =>
    value.declarations.some(isArrowFunctionVariableDeclarator)
  )
)
