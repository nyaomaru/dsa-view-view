import type { ExecutionState } from '@/entities/execution'
import { isUndefined } from '@/shared/lib/guards'
import { isBinarySearchArrayCandidate } from '../../lib/binary-search-view'
import { isAreaViewCandidate } from '../../lib/area-view'
import { isSlidingWindowCandidate } from '../../lib/sliding-window-view'
import { isRollingDpCandidate } from '../../lib/rolling-dp-view'
import { getVisualizableVariableEntries } from './variables'

export function getPrimaryBinarySearchArrayName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): string | undefined {
  const stepIndexes = [
    ...Array.from({ length: executionState.currentStep + 1 }, (_, index) =>
      Math.max(0, executionState.currentStep - index)
    ),
    ...Array.from(
      { length: executionState.steps.length - executionState.currentStep - 1 },
      (_, index) => executionState.currentStep + index + 1
    ),
  ]

  for (const index of stepIndexes) {
    const step = executionState.steps[index]
    if (isUndefined(step)) continue

    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) =>
        initialVariableNames.has(name) &&
        isBinarySearchArrayCandidate(name, value, step.variables)
    )?.[0]

    if (!isUndefined(candidate)) return candidate
  }

  return undefined
}

export function getPrimaryBinarySearchStepIndex(
  executionState: ExecutionState,
  primaryBinarySearchArrayName: string | undefined
): number | undefined {
  if (isUndefined(primaryBinarySearchArrayName)) return undefined

  const stepIndexes = [
    ...Array.from({ length: executionState.currentStep + 1 }, (_, index) =>
      Math.max(0, executionState.currentStep - index)
    ),
    ...Array.from(
      { length: executionState.steps.length - executionState.currentStep - 1 },
      (_, index) => executionState.currentStep + index + 1
    ),
  ]

  for (const index of stepIndexes) {
    const step = executionState.steps[index]
    if (
      !isUndefined(step) &&
      isBinarySearchArrayCandidate(
        primaryBinarySearchArrayName,
        step.variables[primaryBinarySearchArrayName],
        step.variables
      )
    ) {
      return index
    }
  }

  return undefined
}

export function getPrimaryAreaArrayName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): string | undefined {
  for (const step of executionState.steps) {
    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) =>
        initialVariableNames.has(name) &&
        isAreaViewCandidate(name, value, step.variables)
    )?.[0]

    if (!isUndefined(candidate)) return candidate
  }

  return undefined
}

export function getPrimaryAreaStepIndex(
  executionState: ExecutionState,
  primaryAreaArrayName: string | undefined
): number | undefined {
  if (isUndefined(primaryAreaArrayName)) return undefined

  const primaryAreaStepIndex = executionState.steps.findIndex((step) =>
    isAreaViewCandidate(
      primaryAreaArrayName,
      step.variables[primaryAreaArrayName],
      step.variables
    )
  )

  return primaryAreaStepIndex >= 0 ? primaryAreaStepIndex : undefined
}

export function getPrimaryRollingDpArrayName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): string | undefined {
  for (const step of executionState.steps) {
    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) =>
        initialVariableNames.has(name) &&
        isRollingDpCandidate(name, value, step.variables)
    )?.[0]

    if (!isUndefined(candidate)) return candidate
  }

  return undefined
}

export function getPrimarySlidingWindowStringName(
  executionState: ExecutionState
): string | undefined {
  const stepIndexes = [
    ...Array.from({ length: executionState.currentStep + 1 }, (_, index) =>
      Math.max(0, executionState.currentStep - index)
    ),
    ...Array.from(
      { length: executionState.steps.length - executionState.currentStep - 1 },
      (_, index) => executionState.currentStep + index + 1
    ),
  ]

  for (const index of stepIndexes) {
    const step = executionState.steps[index]
    if (isUndefined(step)) continue

    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) => isSlidingWindowCandidate(name, value, step.variables)
    )?.[0]

    if (!isUndefined(candidate)) return candidate
  }

  return undefined
}

export function getPrimarySlidingWindowStepIndex(
  executionState: ExecutionState,
  primarySlidingWindowStringName: string | undefined
): number | undefined {
  if (isUndefined(primarySlidingWindowStringName)) return undefined

  const primarySlidingWindowStepIndex = executionState.steps.findIndex((step) =>
    isSlidingWindowCandidate(
      primarySlidingWindowStringName,
      step.variables[primarySlidingWindowStringName],
      step.variables
    )
  )

  return primarySlidingWindowStepIndex >= 0
    ? primarySlidingWindowStepIndex
    : undefined
}
