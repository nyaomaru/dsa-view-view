import {
  define,
  hasKeys,
  isArray,
  isBoolean,
  isInteger,
  isNonArrayObject,
  isString,
  isStringArray,
  isUndefined,
  oneOfValues,
  type Guard,
} from '@/shared/lib/guards'
import type { ExecutionState, ExecutionStep } from './types'

const isExecutionStepType = oneOfValues(
  'assignment',
  'function-call',
  'return',
  'condition',
  'loop-iteration',
  'function-entry',
  'array-mutation'
)
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
