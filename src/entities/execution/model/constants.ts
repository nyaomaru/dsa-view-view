export const FUNCTION_ARGUMENTS_LABEL = 'function arguments'
export const RETURN_VALUE_LABEL = 'return value'
export const RETURN_LOCATION_LABEL = 'return location'
export const CLASS_RECEIVER_LABEL = '__algorithmVisualizerClassReceiver'
export const FUNCTION_NAME_LABEL = '__algorithmVisualizerFunctionName'

export const STEP_TYPES = {
  FUNCTION_CALL: 'function-call',
  FUNCTION_ENTRY: 'function-entry',
  FUNCTION_THROW: 'function-throw',
  VARIABLE_DECLARATION: 'variable-declaration',
  RETURN: 'return',
  ASSIGNMENT: 'assignment',
  ARRAY_MUTATION: 'array-mutation',
  LOOP_ITERATION: 'loop-iteration',
  CONDITION: 'condition',
  AWAIT_SUSPEND: 'await-suspend',
  AWAIT_RESUME: 'await-resume',
  AWAIT_REJECT: 'await-reject',
} as const

export type ExecutionStepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES]
