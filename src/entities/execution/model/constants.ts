export const FUNCTION_ARGUMENTS_LABEL = 'function arguments'
export const RETURN_VALUE_LABEL = 'return value'
export const RETURN_LOCATION_LABEL = 'return location'
export const CLASS_RECEIVER_LABEL = '__algorithmVisualizerClassReceiver'

export const STEP_TYPES = {
  FUNCTION_CALL: 'function-call',
  FUNCTION_ENTRY: 'function-entry',
  VARIABLE_DECLARATION: 'variable-declaration',
  RETURN: 'return',
  ASSIGNMENT: 'assignment',
  ARRAY_MUTATION: 'array-mutation',
  LOOP_ITERATION: 'loop-iteration',
  CONDITION: 'condition',
} as const

export type ExecutionStepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES]
