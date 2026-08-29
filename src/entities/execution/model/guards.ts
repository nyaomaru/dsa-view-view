import {
  define,
  hasKeys,
  isArray,
  isBoolean,
  isFunction,
  isInteger,
  isNonArrayObject,
  isObject,
  isPrimitive,
  isString,
  isStringArray,
  isUndefined,
  oneOfValues,
  or,
  struct,
  type Guard,
} from '@/shared/lib/guards'
import type { ExecutionState, ExecutionStep } from './types'
import { RUNTIME_COMPARISON_OPERATORS, STEP_TYPES } from './constants'
import type { RuntimeComparison } from './types'

const isExecutionStepType = oneOfValues(Object.values(STEP_TYPES))
export const isRuntimeComparisonOperator = oneOfValues(
  ...RUNTIME_COMPARISON_OPERATORS
)
const isRuntimeComparisonValue = or(isPrimitive, isObject, isFunction)
const isRuntimeComparisonOperand = struct({
  expression: isString,
  value: isRuntimeComparisonValue,
})
const hasExecutionStepKeys = hasKeys(
  'stepNumber',
  'type',
  'line',
  'description',
  'variables',
  'timestamp'
)
const hasExecutionStateKeys = hasKeys(
  'currentStep',
  'totalSteps',
  'steps',
  'isComplete'
)

export const isRuntimeComparison: Guard<RuntimeComparison> = struct({
  left: isRuntimeComparisonOperand,
  operator: isRuntimeComparisonOperator,
  right: isRuntimeComparisonOperand,
  result: isBoolean,
})

export const isExecutionStep: Guard<ExecutionStep> = define<ExecutionStep>(
  (value) => {
    if (!isNonArrayObject(value) || !hasExecutionStepKeys(value)) return false

    return (
      isInteger(value.stepNumber) &&
      isExecutionStepType(value.type) &&
      isInteger(value.line) &&
      isString(value.description) &&
      isNonArrayObject(value.variables) &&
      isInteger(value.timestamp) &&
      (isUndefined(value.column) || isInteger(value.column)) &&
      (isUndefined(value.callStack) || isStringArray(value.callStack)) &&
      (isUndefined(value.scope) || isString(value.scope)) &&
      (isUndefined(value.metadata) || isNonArrayObject(value.metadata))
    )
  }
)

export const isExecutionState: Guard<ExecutionState> = define<ExecutionState>(
  (value) => {
    if (!isNonArrayObject(value) || !hasExecutionStateKeys(value)) return false
    if (!isArray(value.steps) || !value.steps.every(isExecutionStep))
      return false

    return (
      isInteger(value.currentStep) &&
      value.currentStep >= 0 &&
      isInteger(value.totalSteps) &&
      value.totalSteps === value.steps.length &&
      value.currentStep <= Math.max(value.totalSteps - 1, 0) &&
      isBoolean(value.isComplete) &&
      (isUndefined(value.error) || isString(value.error))
    )
  }
)
