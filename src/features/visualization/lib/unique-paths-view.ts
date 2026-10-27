import type { ExecutionState } from '@/entities/execution'
import { arrayOf, isInteger, isMatrix, isNumber } from '@/shared/lib/guards'

export type UniquePathsState = {
  data: readonly (readonly number[])[]
  active?: { row: number; col: number }
  complete: boolean
}

const isNumberGrid = arrayOf(arrayOf(isNumber))

function getUniquePathsFrameId(
  executionState: ExecutionState,
  stepIndex: number
): number | undefined {
  for (let index = stepIndex; index >= 0; index--) {
    const callFrame = executionState.steps[index]?.metadata?.callFrame
    if (!callFrame) continue
    return callFrame.functionName === 'uniquePaths'
      ? callFrame.frameId
      : undefined
  }

  return undefined
}

function getChangedCell(
  previous: readonly (readonly number[])[],
  current: readonly (readonly number[])[]
): { row: number; col: number } | null {
  let changed: { row: number; col: number } | undefined

  for (let row = 0; row < current.length; row++) {
    for (let col = 0; col < current[row].length; col++) {
      if (current[row][col] === previous[row]?.[col]) continue
      if (changed) return null
      changed = { row, col }
    }
  }

  return changed ?? null
}

function isCanonicalUniquePathsTable(
  data: readonly (readonly number[])[]
): boolean {
  return data.every((row, rowIndex) =>
    row.every((value, colIndex) => {
      if (rowIndex === 0 || colIndex === 0) return value === 1
      return value === data[rowIndex - 1][colIndex] + data[rowIndex][colIndex - 1]
    })
  )
}

/** Verifies that captured writes match the standard Unique Paths recurrence. */
function hasCanonicalUniquePathsWrites(
  executionState: ExecutionState,
  stepIndex: number,
  frameId: number
): boolean {
  let previous: readonly (readonly number[])[] | undefined
  let finalTable: readonly (readonly number[])[] | undefined

  for (const step of executionState.steps) {
    if (step.metadata?.callFrame?.frameId !== frameId) continue
    const data = step.variables.dp
    if (!isMatrix(data) || !isNumberGrid(data)) continue
    finalTable = data

    if (step.stepNumber > executionState.steps[stepIndex]?.stepNumber) continue

    if (!previous) {
      if (!data.every((row) => row.every((value) => value === 0))) return false
      previous = data
      continue
    }

    const changed = getChangedCell(previous, data)
    if (!changed) {
      previous = data
      continue
    }

    const { row, col } = changed
    const nextValue = data[row][col]
    const expectedValue =
      row === 0 || col === 0
        ? 1
        : data[row - 1][col] + data[row][col - 1]
    if (nextValue !== expectedValue) return false

    previous = data
  }

  return previous !== undefined && !!finalTable && isCanonicalUniquePathsTable(finalTable)
}

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
  const frameId = getUniquePathsFrameId(executionState, stepIndex)
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
    frameId === undefined ||
    !hasCanonicalUniquePathsWrites(executionState, stepIndex, frameId)
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
