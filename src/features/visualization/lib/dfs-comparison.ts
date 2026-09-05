import type { ExecutionState } from '@/entities/execution'
import { isMatrix, isUndefined } from '@/shared/lib/guards'

export type DfsComparisonExecution = {
  /** Recursive DFS execution aligned to the shared walkthrough position. */
  recursive: ExecutionState
  /** Explicit-stack DFS execution aligned to the shared walkthrough position. */
  iterative: ExecutionState
}

type DfsImplementation = keyof DfsComparisonExecution

function countUnvisitedLand(grid: readonly (readonly unknown[])[]): number {
  return grid.reduce<number>(
    (count, row) =>
      count +
      row.reduce<number>(
        (rowCount, cell) => rowCount + (cell === '1' ? 1 : 0),
        0
      ),
    0
  )
}

function getUnvisitedLandCounts(
  executionState: ExecutionState
): Array<number | undefined> {
  let latestCount: number | undefined

  return executionState.steps.map((step) => {
    const grid = step.variables.grid
    if (isMatrix(grid)) latestCount = countUnvisitedLand(grid)
    return latestCount
  })
}

function getOverallProgressStepIndex(
  sourceState: ExecutionState,
  targetState: ExecutionState
): number {
  const sourceLastStep = Math.max(sourceState.totalSteps - 1, 1)
  const targetLastStep = Math.max(targetState.totalSteps - 1, 0)

  return Math.round((sourceState.currentStep / sourceLastStep) * targetLastStep)
}

/**
 * Aligns a second DFS trace to the same visited-grid phase as the trace driving
 * playback. Repeated instrumentation steps inside a phase are mapped by their
 * relative position so pending-work changes remain visible on both sides.
 */
export function getAlignedDfsStepIndex(
  sourceState: ExecutionState,
  targetState: ExecutionState
): number {
  const sourceLandCounts = getUnvisitedLandCounts(sourceState)
  const targetLandCounts = getUnvisitedLandCounts(targetState)
  const sourceLandCount = sourceLandCounts[sourceState.currentStep]
  if (isUndefined(sourceLandCount)) {
    return getOverallProgressStepIndex(sourceState, targetState)
  }

  const sourcePhaseIndexes = sourceLandCounts.flatMap((landCount, stepIndex) =>
    landCount === sourceLandCount ? [stepIndex] : []
  )
  const targetPhaseIndexes = targetLandCounts.flatMap((landCount, stepIndex) =>
    landCount === sourceLandCount ? [stepIndex] : []
  )
  if (targetPhaseIndexes.length === 0) {
    return getOverallProgressStepIndex(sourceState, targetState)
  }

  const sourcePhasePosition = Math.max(
    sourcePhaseIndexes.indexOf(sourceState.currentStep),
    0
  )
  const sourcePhaseLastPosition = Math.max(sourcePhaseIndexes.length - 1, 1)
  const targetPhaseLastPosition = targetPhaseIndexes.length - 1
  const targetPhasePosition = Math.round(
    (sourcePhasePosition / sourcePhaseLastPosition) * targetPhaseLastPosition
  )

  return targetPhaseIndexes[targetPhasePosition] ?? targetPhaseIndexes[0]
}

function selectStep(
  executionState: ExecutionState,
  currentStep: number
): ExecutionState {
  return {
    ...executionState,
    currentStep,
    isComplete: currentStep >= executionState.totalSteps - 1,
  }
}

/** Builds the fixed left/right comparison while preserving the selected trace as the playback driver. */
export function createDfsComparisonExecution({
  primary,
  counterpart,
  primaryImplementation,
}: {
  /** Execution controlled by the app's playback controls. */
  primary: ExecutionState
  /** Paired execution mapped onto the primary execution position. */
  counterpart: ExecutionState
  /** DFS implementation represented by the primary execution. */
  primaryImplementation: DfsImplementation
}): DfsComparisonExecution {
  const alignedCounterpart = selectStep(
    counterpart,
    getAlignedDfsStepIndex(primary, counterpart)
  )

  return primaryImplementation === 'recursive'
    ? { recursive: primary, iterative: alignedCounterpart }
    : { recursive: alignedCounterpart, iterative: primary }
}
