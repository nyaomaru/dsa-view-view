import { z } from 'zod'
import type { FunctionParameter } from '@/entities/code'
import {
  arrayOf,
  isBoolean,
  isNull,
  isNumber,
  isNumericString,
  isString,
  oneOfValues,
  or,
  safeJsonParse,
} from '@/shared/lib/guards'
import { parseTypedArrayInput } from './typed-array-input'

const isNumberMatrix = arrayOf(arrayOf(isNumber))
const isStringMatrix = arrayOf(arrayOf(isString))
const isBooleanMatrix = arrayOf(arrayOf(isBoolean))
const isListNodeArray = arrayOf(or(isNull, arrayOf(isNumber)))
const isBooleanLiteral = oneOfValues('true', 'false')

/**
 * Maps TypeScript type to Zod schema
 *
 * Converts TypeScript type annotations to corresponding Zod validation schemas
 * for runtime type checking.
 *
 * @param type - TypeScript type string
 * @param optional - Whether the parameter is optional
 * @returns Zod schema for the type
 *
 * @example
 * ```ts
 * const schema = typeToZodSchema('number', false)
 * schema.parse(42) // OK
 * schema.parse('42') // Error
 * ```
 */
export function typeToZodSchema(
  type: string,
  optional: boolean = false
): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (type.toLowerCase()) {
    case 'number':
      schema = z.number({ message: 'Must be a number' })
      break
    case 'string':
      schema = z.string({ message: 'Must be a string' })
      break
    case 'boolean':
      schema = z.boolean({ message: 'Must be a boolean' })
      break
    case 'number-array':
      schema = z.string().refine(
        (val) => {
          try {
            return parseTypedArrayInput(val).every(
              (part) => isNumber(part) || isNumericString(part)
            )
          } catch {
            return false
          }
        },
        { message: 'Must be comma-separated numbers (e.g., 1, 2, 3)' }
      )
      break
    case 'string-array':
      schema = z.string()
      break
    case 'boolean-array':
      schema = z.string().refine(
        (val) => {
          try {
            const parts = parseTypedArrayInput(val).map((v) =>
              String(v).toLowerCase()
            )
            return parts.every(isBooleanLiteral)
          } catch {
            return false
          }
        },
        {
          message: 'Must be comma-separated booleans (e.g., true, false, true)',
        }
      )
      break
    case 'number-matrix':
      schema = z.string().refine(
        (val) => {
          return safeJsonParse(val, isNumberMatrix).valid
        },
        { message: 'Must be a JSON 2D array of numbers (e.g., [[1,2],[3,4]])' }
      )
      break
    case 'string-matrix':
      schema = z.string().refine(
        (val) => {
          return safeJsonParse(val, isStringMatrix).valid
        },
        {
          message:
            'Must be a JSON 2D array of strings (e.g., [["a","b"],["c","d"]])',
        }
      )
      break
    case 'boolean-matrix':
      schema = z.string().refine(
        (val) => {
          return safeJsonParse(val, isBooleanMatrix).valid
        },
        {
          message:
            'Must be a JSON 2D array of booleans (e.g., [[true,false],[false,true]])',
        }
      )
      break
    case 'array':
      schema = z.string().min(1, { message: 'Must be comma-separated values' })
      break
    case 'tree-node':
      schema = z.string()
      break
    case 'list-node':
      schema = z.any()
      break
    case 'list-node-array':
      schema = z.string().refine(
        (val) => safeJsonParse(val, isListNodeArray).valid,
        {
          message:
            'Must be a JSON array of linked lists (e.g., [[1,4,5],[1,3,4],[2,6]])',
        }
      )
      break
    case 'graph-node':
      schema = z.string().refine(
        (val) => {
          return safeJsonParse(val, isNumberMatrix).valid
        },
        {
          message:
            'Must be a JSON adjacency list (e.g., [[2,4],[1,3],[2,4],[1,3]])',
        }
      )
      break
    default:
      schema = z.any()
  }

  return optional ? schema.optional() : schema
}

/**
 * Creates Zod schema from function parameters
 *
 * Generates a Zod object schema that validates all function parameters
 * based on their TypeScript type annotations.
 *
 * @param parameters - Array of function parameters
 * @returns Zod object schema for validation
 *
 * @example
 * ```ts
 * const params = [
 *   { name: 'a', type: 'number', optional: false },
 *   { name: 'b', type: 'string', optional: true }
 * ]
 * const schema = createValidationSchema(params)
 * schema.parse({ a: 42, b: 'hello' }) // OK
 * ```
 */
export function createValidationSchema(
  parameters: FunctionParameter[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  parameters.forEach((param) => {
    shape[param.name] = typeToZodSchema(param.type, param.optional)
  })

  return z.object(shape)
}

/**
 * Validates input values against function parameters
 *
 * Checks if the provided input values match the expected types
 * for all function parameters.
 *
 * @param parameters - Array of function parameters
 * @param values - Input values to validate
 * @returns Validation result with success status and errors
 *
 * @example
 * ```ts
 * const params = [{ name: 'x', type: 'number', optional: false }]
 * const result = validateInputs(params, { x: '42' })
 * console.log(result.success) // false
 * console.log(result.errors) // { x: 'Must be a number' }
 * ```
 */
export function validateInputs(
  parameters: FunctionParameter[],
  values: Record<string, unknown>
): { success: boolean; errors?: Record<string, string> } {
  const schema = createValidationSchema(parameters)

  const validation = schema.safeParse(values)
  if (validation.success) {
    return { success: true }
  }

  const errors: Record<string, string> = {}
  validation.error.issues.forEach((issue) => {
    errors[issue.path.join('.')] = issue.message
  })
  return { success: false, errors }
}
