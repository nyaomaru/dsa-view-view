import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { isInteger, isString, isStringArray } from '@/shared/lib/guards'

/** State required to render a Zigzag Conversion traversal. */
export type ZigzagVisualizationState = {
  source: string
  numRows: number
  rows: readonly string[]
  processedCharacterCount: number
  row: number
  direction: number
}

function getExpectedRows(source: string, numRows: number, count: number) {
  const rows = Array.from({ length: numRows }, () => '')
  let row = 0
  let direction = 1

  for (const char of Array.from(source).slice(0, count)) {
    rows[row] += char
    if (row === 0) direction = 1
    else if (row === numRows - 1) direction = -1
    row += direction
  }

  return rows
}

/**
 * Recognizes the row buffers maintained by the standard Zigzag Conversion
 * implementation. Verifying their contents avoids matching unrelated arrays
 * that happen to be called `rows`.
 */
export function getZigzagStepState(
  step: ExecutionStep | undefined
): ZigzagVisualizationState | null {
  const variables = step?.variables
  const source = variables?.s
  const numRows = variables?.numRows
  const rows = variables?.rows
  const row = variables?.row
  const direction = variables?.direction

  if (
    !isString(source) ||
    !isInteger(numRows) ||
    numRows < 2 ||
    !isStringArray(rows) ||
    rows.length !== numRows ||
    !isInteger(row) ||
    !isInteger(direction) ||
    Math.abs(direction) !== 1
  ) {
    return null
  }

  const processedCharacterCount = Array.from(rows.join('')).length
  if (processedCharacterCount === 0 || processedCharacterCount > Array.from(source).length) {
    return null
  }

  const expectedRows = getExpectedRows(source, numRows, processedCharacterCount)
  if (!rows.every((value, index) => value === expectedRows[index])) return null

  return {
    source,
    numRows,
    rows,
    processedCharacterCount,
    row,
    direction,
  }
}

/** Returns the current Zigzag state, falling back to the first compatible step. */
export function getZigzagVisualizationState(
  executionState: ExecutionState,
  targetStepIndex?: number
): ZigzagVisualizationState | null {
  const currentState = getZigzagStepState(
    executionState.steps[executionState.currentStep]
  )
  if (currentState) return currentState

  return getZigzagStepState(executionState.steps[targetStepIndex ?? -1])
}

/** Finds the first point at which Zigzag row-buffer state is available. */
export function getZigzagStepIndex(
  executionState: ExecutionState
): number | undefined {
  const index = executionState.steps.findIndex((step) => getZigzagStepState(step))
  return index >= 0 ? index : undefined
}
