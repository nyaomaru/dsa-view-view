import { describe, expect, it } from 'vite-plus/test'
import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import { getNQueensVisualizationState } from '@/features/visualization/lib/n-queens-view'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { executeCode } from './runner'

function getExample(id: string) {
  const example = ALGORITHM_EXAMPLES.find((candidate) => candidate.id === id)
  if (!example) throw new Error(`Missing ${id} example`)
  return example
}

describe('N-Queens visualization integration', () => {
  it('visualizes the board maintained by solveNQueens', () => {
    const example = getExample('n-queens')
    const state = executeCode(example.sourceCode, { n: 4 }, 'solveNQueens')
    const detection = detectVisualizationState(state)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toHaveLength(2)
    expect(detection.primaryNQueensStepIndex).toBeDefined()
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'n-queens',
      targetStepIndex: detection.primaryNQueensStepIndex,
    })
  })

  it('reconstructs the board from totalNQueens column tracking', () => {
    const example = getExample('n-queens-ii')
    const state = executeCode(example.sourceCode, { n: 4 }, 'totalNQueens')
    const detection = detectVisualizationState(state)
    const board = getNQueensVisualizationState(
      state,
      detection.primaryNQueensStepIndex
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)
    expect(detection.primaryNQueensStepIndex).toBeDefined()
    expect(board?.placedQueens).toBeGreaterThan(0)
  })
})
