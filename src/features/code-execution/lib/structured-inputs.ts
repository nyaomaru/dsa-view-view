import {
  isParamTypeArray,
  isParamTypeBoolean,
  isParamTypeBooleanArray,
  isParamTypeGraphNode,
  isParamTypeListNode,
  isParamTypeListNodeArray,
  isParamTypeMatrix,
  isParamTypeNumber,
  isParamTypeNumberArray,
  isParamTypeStringArray,
  isParamTypeTreeNode,
  type FunctionParameter,
} from '@/entities/code'
import {
  equals,
  isArray,
  isArrayOfArrays,
  isNil,
  isString,
  isUndefined,
  not,
  safeJsonParse,
} from '@/shared/lib/guards'
import {
  looksLikeTreeStructureInput,
  parseListInput,
  parseTreeInput,
  resolveTreeNodeReference,
} from '@/entities/data-structure'
import { parseTypedArrayInput } from './typed-array-input'

type GraphNodeValue = {
  val: number
  neighbors: GraphNodeValue[]
}

type ConversionContext = {
  primaryTreeParamName?: string
  primaryTreeRoot: ReturnType<typeof parseTreeInput>
}

const isEmptyString = equals('')
const isNullString = equals('null')
const isTrueString = equals('true')
const isDefined = not(isUndefined)

function parseGraphAdjacencyList(
  value: unknown
): readonly (readonly unknown[])[] {
  if (isNil(value)) return []

  if (isString(value)) {
    const trimmed = value.trim()
    if (isEmptyString(trimmed) || isNullString(trimmed.toLowerCase())) return []

    const parsed = safeJsonParse(trimmed, isArrayOfArrays)
    return parsed.valid ? parsed.value : []
  }

  return isArrayOfArrays(value) ? value : []
}

function parseGraphInput(value: unknown): GraphNodeValue | null {
  const adjacencyList = parseGraphAdjacencyList(value)
  if (adjacencyList.length === 0) return null

  const nodes = adjacencyList.map<GraphNodeValue>((_neighbors, index) => ({
    val: index + 1,
    neighbors: [],
  }))

  adjacencyList.forEach((neighbors, index) => {
    nodes[index].neighbors = neighbors
      .map((neighbor) => nodes[Number(neighbor) - 1])
      .filter(isDefined)
  })

  return nodes[0] ?? null
}

function parseListNodeArrayInput(
  value: unknown
): ReturnType<typeof parseListInput>[] {
  const parsed = isString(value) ? safeJsonParse(value, isArray) : null
  const listValues = parsed?.valid
    ? parsed.value
    : isArray(value)
      ? value
      : []

  return listValues.map(parseListInput)
}

/**
 * Reusable structured-input parsers and tree/list construction helpers.
 *
 * @public
 */
export {
  buildTreeFromLevelOrder,
  parseListInput,
  parsePrimitiveToken,
  parseTreeInput,
  resolveTreeNodeReference,
  splitCommaSeparatedTokens,
  unwrapQuotedString,
} from '@/entities/data-structure'

function convertScalarInput(param: FunctionParameter, value: unknown): unknown {
  if (isParamTypeNumber(param) && isString(value)) {
    return parseFloat(value)
  }

  if (isParamTypeBoolean(param) && isString(value)) {
    return isTrueString(value)
  }

  if (isParamTypeNumberArray(param) && isString(value)) {
    const trimmed = value.trim()
    return isEmptyString(trimmed)
      ? []
      : parseTypedArrayInput(trimmed).map((v) => Number(v))
  }

  if (isParamTypeStringArray(param) && isString(value)) {
    const trimmed = value.trim()
    return isEmptyString(trimmed)
      ? []
      : parseTypedArrayInput(trimmed).map(String)
  }

  if (isParamTypeBooleanArray(param) && isString(value)) {
    const trimmed = value.trim()
    return isEmptyString(trimmed)
      ? []
      : parseTypedArrayInput(trimmed).map((v) =>
          isTrueString(String(v).toLowerCase())
        )
  }

  if (isParamTypeMatrix(param) && isString(value)) {
    return JSON.parse(value)
  }

  if (isParamTypeArray(param) && isString(value)) {
    const parsed = safeJsonParse(value, isArray)
    return parsed.valid
      ? [...parsed.value]
      : value.split(',').map((v) => v.trim())
  }

  return value
}

function convertTreeInput(
  param: FunctionParameter,
  value: unknown,
  context: ConversionContext
): unknown {
  if (param.name === context.primaryTreeParamName) {
    return context.primaryTreeRoot
  }

  return looksLikeTreeStructureInput(value)
    ? parseTreeInput(value)
    : resolveTreeNodeReference(context.primaryTreeRoot, value)
}

function convertParameterInput(
  param: FunctionParameter,
  value: unknown,
  context: ConversionContext
): unknown {
  if (isParamTypeTreeNode(param)) {
    return convertTreeInput(param, value, context)
  }
  if (isParamTypeListNode(param)) return parseListInput(value)
  if (isParamTypeListNodeArray(param)) return parseListNodeArrayInput(value)
  if (isParamTypeGraphNode(param)) return parseGraphInput(value)
  return convertScalarInput(param, value)
}

/**
 * Converts raw form values into runtime values for parsed function parameters.
 *
 * Tree parameters share a primary root so secondary tree-node parameters can
 * resolve references into the same tree. Other structured and scalar inputs
 * are converted according to their parsed parameter type.
 *
 * @param parameters Parsed function parameter definitions.
 * @param data Raw values keyed by parameter name.
 * @returns Runtime-ready values keyed by parameter name.
 */
export function convertInputValues(
  parameters: FunctionParameter[],
  data: Record<string, unknown>
): Record<string, unknown> {
  const primaryTreeParam = parameters.find(isParamTypeTreeNode)
  const context: ConversionContext = {
    primaryTreeParamName: primaryTreeParam?.name,
    primaryTreeRoot: primaryTreeParam
      ? parseTreeInput(data[primaryTreeParam.name])
      : null,
  }

  return Object.fromEntries(
    parameters.map((param) => [
      param.name,
      convertParameterInput(param, data[param.name], context),
    ])
  )
}
