import type { TSTypeAnnotation, TSType, TypeAnnotation } from '@babel/types'
import {
  isArrayTypeReference,
  isGraphNodeTypeReference,
  isListNodeTypeReference,
  isTreeNodeTypeReference,
  isTSArrayTypeNode,
  isTSParenthesizedTypeNode,
  isTSUnionTypeNode,
  isTypeAnnotationNode,
} from './parser-guards'

export const DEFAULT_TYPE = 'any'

const PARSED_TYPES = {
  any: DEFAULT_TYPE,
  array: 'array',
  boolean: 'boolean',
  booleanArray: 'boolean-array',
  booleanMatrix: 'boolean-matrix',
  graphNode: 'graph-node',
  listNode: 'list-node',
  listNodeArray: 'list-node-array',
  null: 'null',
  number: 'number',
  numberArray: 'number-array',
  numberMatrix: 'number-matrix',
  string: 'string',
  stringArray: 'string-array',
  stringMatrix: 'string-matrix',
  treeNode: 'tree-node',
  undefined: 'undefined',
} as const

function getArrayTypeName(elementType: TSType): string {
  if (isTSArrayTypeNode(elementType)) {
    const innerType = elementType.elementType
    if (innerType.type === 'TSNumberKeyword') return PARSED_TYPES.numberMatrix
    if (innerType.type === 'TSStringKeyword') return PARSED_TYPES.stringMatrix
    if (innerType.type === 'TSBooleanKeyword') return PARSED_TYPES.booleanMatrix
  }

  if (elementType.type === 'TSNumberKeyword') return PARSED_TYPES.numberArray
  if (elementType.type === 'TSStringKeyword') return PARSED_TYPES.stringArray
  if (elementType.type === 'TSBooleanKeyword') return PARSED_TYPES.booleanArray

  if (getTypeFromTSType(elementType) === PARSED_TYPES.listNode) {
    return PARSED_TYPES.listNodeArray
  }

  return PARSED_TYPES.array
}

export function getTypeFromAnnotation(
  typeAnnotation: TSTypeAnnotation | TypeAnnotation | null | undefined
): string {
  if (!isTypeAnnotationNode(typeAnnotation)) {
    return DEFAULT_TYPE
  }

  return getTypeFromTSType(typeAnnotation.typeAnnotation)
}

function getTypeFromTSType(typeNode: TSType): string {
  const type = typeNode.type

  if (type === 'TSNumberKeyword') return PARSED_TYPES.number
  if (type === 'TSStringKeyword') return PARSED_TYPES.string
  if (type === 'TSBooleanKeyword') return PARSED_TYPES.boolean

  if (isTSArrayTypeNode(typeNode)) {
    return getArrayTypeName(typeNode.elementType)
  }

  if (isArrayTypeReference(typeNode)) {
    return getArrayTypeName(typeNode.typeArguments.params[0])
  }

  if (isTreeNodeTypeReference(typeNode)) {
    return PARSED_TYPES.treeNode
  }

  if (isListNodeTypeReference(typeNode)) {
    return PARSED_TYPES.listNode
  }

  if (isGraphNodeTypeReference(typeNode)) {
    return PARSED_TYPES.graphNode
  }

  if (isTSUnionTypeNode(typeNode)) {
    const resolvedTypes = typeNode.types
      .map((member) => getTypeFromTSType(member))
      .filter(
        (memberType) =>
          memberType !== PARSED_TYPES.null &&
          memberType !== PARSED_TYPES.undefined
      )

    if (resolvedTypes.length === 1) {
      return resolvedTypes[0]
    }

    const uniqueTypes = [...new Set(resolvedTypes)]
    if (uniqueTypes.length === 1) {
      return uniqueTypes[0]
    }
  }

  if (type === 'TSNullKeyword') return PARSED_TYPES.null
  if (type === 'TSUndefinedKeyword') return PARSED_TYPES.undefined
  if (isTSParenthesizedTypeNode(typeNode)) {
    return getTypeFromTSType(typeNode.typeAnnotation)
  }

  return DEFAULT_TYPE
}
