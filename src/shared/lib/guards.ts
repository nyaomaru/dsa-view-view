import {
  and,
  arrayOf,
  define,
  isBoolean,
  isArray,
  isNumber,
  isObject,
  isString,
  not,
  or,
  predicateToRefine,
} from 'is-kit'

export {
  arrayOf,
  define,
  equals,
  hasKey,
  hasKeys,
  isArray,
  isBoolean,
  isError,
  isFunction,
  isInstanceOf,
  isInteger,
  isNil,
  isNull,
  isNumber,
  isObject,
  isPlainObject,
  isPrimitive,
  isSymbol,
  isString,
  isUndefined,
  not,
  oneOfValues,
  or,
  predicateToRefine,
  lazy,
  recordOf,
  safeJsonParse,
} from 'is-kit'

export type { Guard } from 'is-kit'

/** Numeric form accepted by numeric input and visualization guards. */
export type NumericValue = number | string
/** Rectangular two-dimensional array value. */
export type MatrixValue = readonly (readonly unknown[])[]

export const isNumericString = and(
  isString,
  predicateToRefine<string>((value) => {
    return value.trim() !== '' && Number.isFinite(Number(value))
  })
)

export const isNumericValue = or(isNumber, isNumericString)

export const isNumericArray = arrayOf(isNumericValue)

export const isBooleanArray = arrayOf(isBoolean)

export const isArrayOfArrays = arrayOf(isArray)

export const isStringArray = arrayOf(isString)

export const isNonArrayObject = and(isObject, not(isArray))

export const isNestedArray = and(
  isArray,
  predicateToRefine<readonly unknown[]>((value) => value.some(isArray))
)

export const isMatrix = define<MatrixValue>((value) => {
  if (!isArrayOfArrays(value) || value.length === 0) return false

  const firstRowLength = value[0]?.length
  return value.every((row) => row.length === firstRowLength)
})

export const isAdjacencyList = define<MatrixValue>((value) => {
  return isArrayOfArrays(value) && value.length > 0 && !isMatrix(value)
})

export const isGraphSource = or(isArray, isObject)
