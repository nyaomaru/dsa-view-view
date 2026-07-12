import { equals, oneOfValues } from '@/shared/lib/guards'
import type { FunctionParameter } from './types'

const isParameterType = (type: string) => {
  const isType = equals(type)
  return (parameter: FunctionParameter): boolean => isType(parameter.type)
}

/** Whether a parameter accepts a number. */
export const isParamTypeNumber = isParameterType('number')
/** Whether a parameter accepts a boolean. */
export const isParamTypeBoolean = isParameterType('boolean')
/** Whether a parameter accepts a generic array. */
export const isParamTypeArray = isParameterType('array')
/** Whether a parameter accepts a number array. */
export const isParamTypeNumberArray = isParameterType('number-array')
/** Whether a parameter accepts a string array. */
export const isParamTypeStringArray = isParameterType('string-array')
/** Whether a parameter accepts a boolean array. */
export const isParamTypeBooleanArray = isParameterType('boolean-array')
/** Whether a parameter accepts a number matrix. */
export const isParamTypeNumberMatrix = isParameterType('number-matrix')
/** Whether a parameter accepts a string matrix. */
export const isParamTypeStringMatrix = isParameterType('string-matrix')
/** Whether a parameter accepts a boolean matrix. */
export const isParamTypeBooleanMatrix = isParameterType('boolean-matrix')
/** Whether a parameter accepts a tree node. */
export const isParamTypeTreeNode = isParameterType('tree-node')
/** Whether a parameter accepts a list node. */
export const isParamTypeListNode = isParameterType('list-node')
/** Whether a parameter accepts a graph node. */
export const isParamTypeGraphNode = isParameterType('graph-node')

const isArrayType = oneOfValues(
  'array',
  'number-array',
  'string-array',
  'boolean-array'
)

/** Whether a parameter accepts any supported array representation. */
export const isParamTypeArrayLike = (parameter: FunctionParameter): boolean =>
  isArrayType(parameter.type)

const isMatrixType = oneOfValues(
  'number-matrix',
  'string-matrix',
  'boolean-matrix'
)

/** Whether a parameter accepts any supported matrix representation. */
export const isParamTypeMatrix = (parameter: FunctionParameter): boolean =>
  isMatrixType(parameter.type)
