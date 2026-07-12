import type { ExecutionState } from '@/entities/execution'
import { isUndefined } from '@/shared/lib/guards'
import { getMapVisualizationState } from '../../lib/map-view'
import { getVisualizableVariableEntries } from './variables'

export function getPrimaryMapName(
  executionState: ExecutionState
): string | undefined {
  for (const step of executionState.steps) {
    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) =>
        getMapVisualizationState(name, value, step.variables) !== null
    )?.[0]

    if (!isUndefined(candidate)) return candidate
  }

  return undefined
}

export function getPrimaryMapStepIndex(
  executionState: ExecutionState,
  primaryMapName: string | undefined
): number | undefined {
  if (isUndefined(primaryMapName)) return undefined

  const stepIndex = executionState.steps.findIndex(
    (step) =>
      getMapVisualizationState(
        primaryMapName,
        step.variables[primaryMapName],
        step.variables
      ) !== null
  )

  return stepIndex >= 0 ? stepIndex : undefined
}
