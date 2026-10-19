import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { STEP_TYPES } from '@/entities/execution'
import { describe, expect, it } from 'vite-plus/test'
import {
  getNQueensStepIndex,
  getNQueensVisualizationState,
} from './n-queens-view'

function step(variables: Record<string, unknown>): ExecutionStep {
  return {
    stepNumber: 0,
    type: STEP_TYPES.VARIABLE_DECLARATION,
    line: 1,
    description: '',
    variables,
    timestamp: 0,
  }
}

describe('N-Queens visualization state', () => {
  it('renders the explicit board maintained by solveNQueens', () => {
    const state: ExecutionState = {
      currentStep: 0,
      totalSteps: 1,
      steps: [
        step({
          n: 4,
          row: 2,
          col: 3,
          board: [
            ['.', 'Q', '.', '.'],
            ['.', '.', '.', 'Q'],
            ['.', '.', '.', '.'],
            ['.', '.', '.', '.'],
          ],
          cols: new Set([1, 3]),
          diag1: new Set([-1, -2]),
          diag2: new Set([1, 4]),
        }),
      ],
      isComplete: false,
    }

    expect(getNQueensStepIndex(state)).toBe(0)
    expect(getNQueensVisualizationState(state)).toMatchObject({
      size: 4,
      currentRow: 2,
      currentColumn: 3,
      placedQueens: 2,
      board: [
        [false, true, false, false],
        [false, false, false, true],
        [false, false, false, false],
        [false, false, false, false],
      ],
    })
  })

  it('reconstructs placements from the insertion-ordered column set in totalNQueens', () => {
    const state: ExecutionState = {
      currentStep: 0,
      totalSteps: 1,
      steps: [
        step({
          n: 4,
          row: 3,
          count: 1,
          cols: new Set([1, 3, 0]),
          diag1: new Set([1, 4, 2]),
          diag2: new Set([-1, -2, 2]),
        }),
      ],
      isComplete: false,
    }

    expect(getNQueensVisualizationState(state)).toMatchObject({
      board: [
        [false, true, false, false],
        [false, false, false, true],
        [true, false, false, false],
        [false, false, false, false],
      ],
      placedQueens: 3,
      solutionCount: 1,
    })
  })
})
