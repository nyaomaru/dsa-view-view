import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'

import { getFirstMissingPositiveVisualizationState } from './first-missing-positive-view'

describe('getFirstMissingPositiveVisualizationState', () => {
  it('does not expose a target index after it leaves the active scope', () => {
    const executionState: ExecutionState = {
      currentStep: 0,
      totalSteps: 1,
      isComplete: false,
      steps: [
        {
          stepNumber: 0,
          type: 'loop-iteration',
          line: 12,
          description: 'validate placement',
          timestamp: 0,
          variables: {
            nums: [1, -1, 3, 4],
            n: 4,
            i: 1,
            targetIndex: 2,
          },
          metadata: {
            callFrame: {
              frameId: 1,
              functionName: 'firstMissingPositive',
              phase: 'update',
              visibleVariableNames: ['nums', 'n', 'i'],
            },
          },
        },
      ],
    }

    expect(
      getFirstMissingPositiveVisualizationState({
        executionState,
        variableName: 'nums',
      })
    ).toEqual({
      data: [1, -1, 3, 4],
      n: 4,
      index: 1,
      targetIndex: undefined,
    })
  })
})
