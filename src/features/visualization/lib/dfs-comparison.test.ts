import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'
import { getAlignedDfsStepIndex } from './dfs-comparison'

function createState(
  landCounts: number[],
  currentStep: number
): ExecutionState {
  return {
    currentStep,
    totalSteps: landCounts.length,
    isComplete: currentStep === landCounts.length - 1,
    steps: landCounts.map((landCount, stepNumber) => ({
      stepNumber,
      type: 'assignment',
      line: stepNumber + 1,
      description: `land=${landCount}`,
      variables: {
        grid: [
          [
            ...Array.from({ length: landCount }, () => '1'),
            ...Array.from({ length: 4 - landCount }, () => '0'),
          ],
        ],
      },
      timestamp: stepNumber,
    })),
  }
}

describe('DFS comparison trace alignment', () => {
  it('aligns repeated instrumentation steps within the same visited-grid phase', () => {
    const recursive = createState([4, 4, 3, 3, 3, 2], 3)
    const iterative = createState([4, 3, 3, 2], 0)

    expect(getAlignedDfsStepIndex(recursive, iterative)).toBe(2)
  })

  it('maps completed traversal to the counterpart final step', () => {
    const recursive = createState([2, 1, 0], 2)
    const iterative = createState([2, 2, 1, 1, 0], 0)

    expect(getAlignedDfsStepIndex(recursive, iterative)).toBe(4)
  })
})
