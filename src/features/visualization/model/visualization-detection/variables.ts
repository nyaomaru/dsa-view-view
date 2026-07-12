import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { RETURN_VALUE_LABEL } from '@/entities/execution'
import { equals, oneOfValues } from '@/shared/lib/guards'
import type { InitialVariableContext, VariableEntries } from './types'

export const RESULT_VARIABLE_NAME = 'result'
const WORKING_PATH_VARIABLE_NAMES = new Set(['path'])
const isResultLikeNormalizedName = oneOfValues(
  'answer',
  'res',
  RESULT_VARIABLE_NAME
)
const isReturnValueName = equals(RETURN_VALUE_LABEL)
export const isResultVariableName = equals(RESULT_VARIABLE_NAME)
const TRAVERSAL_WORKLIST_NAMES = new Set([
  'deque',
  'frontier',
  'q',
  'queue',
  'stack',
])

export function isConstantLikeName(name: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(name)
}

export function isTraversalWorklistName(name: string): boolean {
  return TRAVERSAL_WORKLIST_NAMES.has(name.toLowerCase())
}

export function isWorkingPathName(name: string): boolean {
  return WORKING_PATH_VARIABLE_NAMES.has(name.toLowerCase())
}

export function isResultLikeName(name: string): boolean {
  return isResultLikeNormalizedName(name.toLowerCase())
}

function isVisualizableVariableName(name: string): boolean {
  return !isReturnValueName(name)
}

export function getVisualizableVariableEntries(
  variables: ExecutionStep['variables']
): VariableEntries {
  return Object.entries(variables).filter(([name]) =>
    isVisualizableVariableName(name)
  )
}

export function getInitialVariableContext(
  executionState: ExecutionState
): InitialVariableContext {
  const initialVariablesStep = executionState.steps.find(
    (step) => Object.keys(step.variables).length > 0
  )
  return {
    initialVariableStepNumber: initialVariablesStep?.stepNumber ?? -1,
    initialVariableNames: new Set(
      getVisualizableVariableEntries(initialVariablesStep?.variables ?? {}).map(
        ([name]) => name
      )
    ),
  }
}
