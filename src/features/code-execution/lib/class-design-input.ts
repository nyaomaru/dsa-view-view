import type { InputValues } from '@/entities/execution'
import {
  define,
  hasKeys,
  isArrayOfArrays,
  isNonArrayObject,
  isString,
  isStringArray,
} from '@/shared/lib/guards'

export const CLASS_DESIGN_INPUT_KEY = '__algorithmVisualizerClassDesignInput'

/**
 * Structured input for class-design problems such as queue/stack APIs.
 */
export type ClassDesignInput = {
  /** Class name to instantiate. */
  className: string
  /** Constructor and method names in execution order. */
  operations: string[]
  /** Arguments for each operation. */
  args: unknown[][]
}

export function createClassDesignInput(
  className: string,
  operations: string[],
  args: unknown[][]
): InputValues {
  return {
    [CLASS_DESIGN_INPUT_KEY]: {
      className,
      operations,
      args,
    },
  }
}

export const isClassDesignOperations = isStringArray

export const isClassDesignArgs = isArrayOfArrays

const hasClassDesignKeys = hasKeys('className', 'operations', 'args')

export const isClassDesignInput = define<ClassDesignInput>(
  (value) =>
    isNonArrayObject(value) &&
    hasClassDesignKeys(value) &&
    isString(value.className) &&
    isClassDesignOperations(value.operations) &&
    isClassDesignArgs(value.args)
)
