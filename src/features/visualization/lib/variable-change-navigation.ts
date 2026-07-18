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
  if (
    !hasVariable(previousStep.variables, variableName) ||
    !hasVariable(currentStep.variables, variableName)
  ) {
    return undefined
  }

  const previousValue = previousStep.variables[variableName]
  const currentValue = currentStep.variables[variableName]
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

/** Builds the ordered value-change history for one variable. */
export function getVariableChangeHistory(
  steps: ExecutionStep[],
  variableName: string
): VariableChange[] {
  return steps.flatMap((_step, stepIndex) => {
    const change = getVariableChangeFromSteps(steps, variableName, stepIndex)
    return isUndefined(change) ? [] : [change]
  })
}

/** Finds the nearest history entry strictly before the supplied step. */
export function findPreviousChangeInHistory(
  changes: VariableChange[],
  beforeStepIndex: number
): VariableChange | undefined {
  for (let index = changes.length - 1; index >= 0; index -= 1) {
    const change = changes[index]
    if (!isUndefined(change) && change.stepIndex < beforeStepIndex) {
      return change
    }
  }

  return undefined
}

/** Finds the nearest variable transition strictly before the supplied step. */
export function findPreviousVariableChange(
  executionState: ExecutionState,
  variableName: string,
  beforeStepIndex: number
): VariableChange | undefined {
  return findPreviousChangeInHistory(
    getVariableChangeHistory(executionState.steps, variableName),
    beforeStepIndex
  )
}
