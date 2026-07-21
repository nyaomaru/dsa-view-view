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
import { define } from '@/shared/lib/guards'

const LIST_NODE_TYPE_NAME = 'ListNode'
const TREE_NODE_TYPE_NAME = 'TreeNode'
const GRAPH_NODE_TYPE_NAMES = new Set(['_Node', 'GraphNode'])
const ARRAY_TYPE_NAMES = new Set(['Array', 'ReadonlyArray'])

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

export const isArrayTypeReference = define<ArrayTypeReference>((value) => {
  return (
    isTSTypeReferenceNode(value) &&
    isIdentifierNode(value.typeName) &&
    ARRAY_TYPE_NAMES.has(value.typeName.name) &&
    value.typeArguments?.params.length === 1
  )
})

export const isTSUnionTypeNode = define<TSUnionType>((value) =>
  isBabelTSUnionType(value as Node | null | undefined)
)

export const isTSParenthesizedTypeNode = define<TSParenthesizedType>((value) =>
  isBabelTSParenthesizedType(value as Node | null | undefined)
)

export const isTypeAnnotationNode = define<TSTypeAnnotation>((value) =>
  isBabelTSTypeAnnotation(value as Node | null | undefined)
)

export const isTreeNodeTypeReference = define<TreeNodeTypeReference>(
  (value) => {
    return (
      isTSTypeReferenceNode(value) &&
      isIdentifierNode(value.typeName) &&
      value.typeName.name === TREE_NODE_TYPE_NAME
    )
  }
)

export const isListNodeTypeReference = define<TreeNodeTypeReference>(
  (value) => {
    return (
      isTSTypeReferenceNode(value) &&
      isIdentifierNode(value.typeName) &&
      value.typeName.name === LIST_NODE_TYPE_NAME
    )
  }
)

export const isGraphNodeTypeReference = define<TreeNodeTypeReference>(
  (value) => {
    return (
      isTSTypeReferenceNode(value) &&
      isIdentifierNode(value.typeName) &&
      GRAPH_NODE_TYPE_NAMES.has(value.typeName.name)
    )
  }
)

export const isNamedFunctionDeclaration = define<NamedFunctionDeclaration>(
  (value) => {
    return isFunctionDeclarationNode(value) && isIdentifierNode(value.id)
  }
)

export const isArrowFunctionVariableDeclarator =
  define<ArrowFunctionVariableDeclarator>((value) => {
    return (
      isVariableDeclaratorNode(value) &&
      isIdentifierNode(value.id) &&
      isArrowFunctionExpressionNode(value.init)
    )
  })

export const isArrowFunctionVariableDeclaration = define<VariableDeclaration>(
  (value) => {
    return (
      isVariableDeclarationNode(value) &&
      value.declarations.some(isArrowFunctionVariableDeclarator)
    )
  }
)
