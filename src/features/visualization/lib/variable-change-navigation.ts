import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import {
  isDate,
  isMap,
  isObject,
  isRegExp,
  isSet,
  isUndefined,
} from '@/shared/lib/guards'

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

type ComparedObjects = {
  leftToRight: WeakMap<object, object>
  rightToLeft: WeakMap<object, object>
}

function areVariableValuesEqual(
  left: unknown,
  right: unknown,
  compared: ComparedObjects = {
    leftToRight: new WeakMap(),
    rightToLeft: new WeakMap(),
  }
): boolean {
  if (Object.is(left, right)) return true
  if (!isObject(left) || !isObject(right)) return false

  const comparedRight = compared.leftToRight.get(left)
  const comparedLeft = compared.rightToLeft.get(right)
  if (!isUndefined(comparedRight) || !isUndefined(comparedLeft)) {
    return comparedRight === right && comparedLeft === left
  }

  compared.leftToRight.set(left, right)
  compared.rightToLeft.set(right, left)

  if (isDate(left) || isDate(right)) {
    return (
      isDate(left) &&
      isDate(right) &&
      Object.is(left.getTime(), right.getTime())
    )
  }

  if (isRegExp(left) || isRegExp(right)) {
    return (
      isRegExp(left) &&
      isRegExp(right) &&
      left.source === right.source &&
      left.flags === right.flags
    )
  }

  if (isMap(left) || isMap(right)) {
    if (!isMap(left) || !isMap(right) || left.size !== right.size) return false

    const leftEntries = Array.from(left.entries())
    const rightEntries = Array.from(right.entries())
    return leftEntries.every(([leftKey, leftValue], index) => {
      const rightEntry = rightEntries[index]
      return (
        !isUndefined(rightEntry) &&
        areVariableValuesEqual(leftKey, rightEntry[0], compared) &&
        areVariableValuesEqual(leftValue, rightEntry[1], compared)
      )
    })
  }

  if (isSet(left) || isSet(right)) {
    if (!isSet(left) || !isSet(right) || left.size !== right.size) return false

    const leftValues = Array.from(left.values())
    const rightValues = Array.from(right.values())
    return leftValues.every((leftValue, index) =>
      areVariableValuesEqual(leftValue, rightValues[index], compared)
    )
  }

  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false

  const leftKeys = Reflect.ownKeys(left)
  const rightKeys = Reflect.ownKeys(right)
  if (leftKeys.length !== rightKeys.length) return false

  return leftKeys.every((key) => {
    if (!Object.hasOwn(right, key)) return false

    const leftDescriptor = Object.getOwnPropertyDescriptor(left, key)
    const rightDescriptor = Object.getOwnPropertyDescriptor(right, key)
    if (isUndefined(leftDescriptor) || isUndefined(rightDescriptor))
      return false
    if (
      leftDescriptor.enumerable !== rightDescriptor.enumerable ||
      leftDescriptor.configurable !== rightDescriptor.configurable ||
      leftDescriptor.writable !== rightDescriptor.writable
    ) {
      return false
    }

    if ('value' in leftDescriptor && 'value' in rightDescriptor) {
      return areVariableValuesEqual(
        leftDescriptor.value,
        rightDescriptor.value,
        compared
      )
    }

    return (
      leftDescriptor.get === rightDescriptor.get &&
      leftDescriptor.set === rightDescriptor.set
    )
  })
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
