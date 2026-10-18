import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { isInteger, isSet, isString } from '@/shared/lib/guards'

export type NQueensVisualizationState = {
  size: number
  board: boolean[][]
  currentRow: number | null
  currentColumn: number | null
  placedQueens: number
  solutionCount: number | null
}

function isBoardCell(value: unknown): boolean {
  return isString(value) && (value === 'Q' || value === '.')
}

function getBoardFromMatrix(value: unknown, size: number): boolean[][] | null {
  if (!Array.isArray(value) || value.length !== size) return null

  const board = value.map((boardRow) => {
    if (!Array.isArray(boardRow) || boardRow.length !== size) return null
    if (!boardRow.every(isBoardCell)) return null
    return boardRow.map((cell) => cell === 'Q')
  })

  return board.every((boardRow) => boardRow !== null)
    ? (board as boolean[][])
    : null
}

function getBoardFromColumns(value: unknown, size: number): boolean[][] | null {
  if (!isSet(value)) return null

  const columns = [...value]
  if (
    !columns.every(isInteger) ||
    columns.some((column) => column < 0 || column >= size)
  ) {
    return null
  }

  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  )
  columns.forEach((column, row) => {
    if (row < size) board[row]![column] = true
  })
  return board
}

function readNQueensStep(
  step: ExecutionStep | undefined
): NQueensVisualizationState | null {
  const variables = step?.variables
  if (!variables || !isInteger(variables.n) || variables.n < 1) return null

  const size = variables.n
  const hasNQueensTrackingSets =
    isSet(variables.cols) && isSet(variables.diag1) && isSet(variables.diag2)
  if (!hasNQueensTrackingSets) return null

  const board =
    getBoardFromMatrix(variables.board, size) ??
    getBoardFromColumns(variables.cols, size)
  if (!board) return null

  const currentRow =
    isInteger(variables.row) && variables.row >= 0 && variables.row <= size
      ? variables.row
      : null
  const currentColumn =
    isInteger(variables.col) && variables.col >= 0 && variables.col < size
      ? variables.col
      : null
  const solutionCount =
    isInteger(variables.count) && variables.count >= 0 ? variables.count : null

  return {
    size,
    board,
    currentRow,
    currentColumn,
    placedQueens: board.flat().filter(Boolean).length,
    solutionCount,
  }
}

/** Returns the current N-Queens state, falling back to the first compatible step. */
export function getNQueensVisualizationState(
  executionState: ExecutionState,
  targetStepIndex?: number
): NQueensVisualizationState | null {
  const currentState = readNQueensStep(
    executionState.steps[executionState.currentStep]
  )
  if (currentState && currentState.placedQueens > 0) return currentState

  for (let index = executionState.currentStep - 1; index >= 0; index -= 1) {
    const previousState = readNQueensStep(executionState.steps[index])
    if (previousState && previousState.placedQueens > 0) return previousState
  }

  return (
    currentState ?? readNQueensStep(executionState.steps[targetStepIndex ?? -1])
  )
}

/** Finds the first step that exposes a standard N-Queens backtracking state. */
export function getNQueensStepIndex(
  executionState: ExecutionState
): number | undefined {
  const index = executionState.steps.findIndex(
    (step) => (readNQueensStep(step)?.placedQueens ?? 0) > 0
  )
  return index >= 0 ? index : undefined
}
