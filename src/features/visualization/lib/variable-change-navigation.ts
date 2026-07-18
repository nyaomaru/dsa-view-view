import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { isObject, isUndefined } from '@/shared/lib/guards'
import { safeStringify } from '@/shared/lib/safe-stringify'

/** A variable value transition captured between adjacent execution steps. */
export type VariableChange = {
  /** Index of the step containing the new value. */
  stepIndex: number
  /** Value captured immediately before the change. */
  previousValue: unknown
  /** Value captured at the change step. */
  currentValue: unknown
}

function hasVariable(
  variables: Record<string, unknown>,
  variableName: string
): boolean {
  return Object.hasOwn(variables, variableName)
}

function areVariableValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (!isObject(left) || !isObject(right)) return false

  return safeStringify(left) === safeStringify(right)
}

function getVariableChangeFromSteps(
  steps: ExecutionStep[],
  variableName: string,
  stepIndex: number
): VariableChange | undefined {
  if (stepIndex <= 0) return undefined

  const previousStep = steps[stepIndex - 1]
  const currentStep = steps[stepIndex]
  if (isUndefined(previousStep) || isUndefined(currentStep)) return undefined
  const previousVariables = previousStep.variables
  const currentVariables = currentStep.variables
  if (
    !hasVariable(previousVariables, variableName) ||
    !hasVariable(currentVariables, variableName)
  ) {
    return undefined
  }

  const previousValue = previousVariables[variableName]
  const currentValue = currentVariables[variableName]
  if (areVariableValuesEqual(previousValue, currentValue)) return undefined

  return {
    stepIndex,
    previousValue,
    currentValue,
  }
}

/** Returns a variable transition when the selected step changed its value. */
export function getVariableChangeAtStep(
  executionState: ExecutionState,
  variableName: string,
  stepIndex: number
): VariableChange | undefined {
  return getVariableChangeFromSteps(
    executionState.steps,
    variableName,
    stepIndex
  )
}

/** Finds the nearest variable transition strictly before the supplied step. */
export function findPreviousVariableChange(
  executionState: ExecutionState,
  variableName: string,
  beforeStepIndex: number
): VariableChange | undefined {
  const { steps } = executionState
  const firstCandidateStep = Math.min(beforeStepIndex - 1, steps.length - 1)

  for (let stepIndex = firstCandidateStep; stepIndex > 0; stepIndex -= 1) {
    const change = getVariableChangeFromSteps(steps, variableName, stepIndex)
    if (!isUndefined(change)) return change
  }

  return undefined
}
