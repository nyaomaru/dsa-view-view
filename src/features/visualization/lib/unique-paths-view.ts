import type { ExecutionState } from '@/entities/execution'
import { arrayOf, isInteger, isMatrix, isNumber } from '@/shared/lib/guards'

export type UniquePathsState = {
  data: readonly (readonly number[])[]
  active?: { row: number; col: number }
  complete: boolean
}

const isNumberGrid = arrayOf(arrayOf(isNumber))

/** Reads actual DP snapshots, keeping the latest written cell selected between writes. */
export function getUniquePathsVisualizationState(
  executionState: ExecutionState,
  stepIndex: number,
  name: string
): UniquePathsState | null {
  const step = executionState.steps[stepIndex]
  const data = step?.variables[name]
  const m = step?.variables.m
  const n = step?.variables.n
  if (
    name !== 'dp' ||
    !isInteger(m) ||
    !isInteger(n) ||
    m < 1 ||
    n < 1 ||
    !isMatrix(data) ||
    !isNumberGrid(data) ||
    data.length !== m ||
    data[0].length !== n ||
    !executionState.steps.some(
      (item) => item.metadata?.callFrame?.functionName === 'uniquePaths'
    )
  )
    return null

  let active: UniquePathsState['active']
  for (let index = stepIndex; index > 0 && !active; index--) {
    const current = executionState.steps[index]?.variables[name]
    const previous = executionState.steps[index - 1]?.variables[name]
    if (!isNumberGrid(current) || !isNumberGrid(previous)) continue
    for (let row = 0; row < m && !active; row++) {
      for (let col = 0; col < n; col++) {
        if (current[row]?.[col] !== previous[row]?.[col]) {
          active = { row, col }
          break
        }
      }
    }
  }

  return {
    data,
    active,
    complete:
      stepIndex === executionState.steps.length - 1 &&
      !executionState.error &&
      isNumber(executionState.returnValue),
  }
}
