import { describe, expect, it } from 'vite-plus/test'

import type { ExecutionState } from '@/entities/execution'

import {
  getAreaVisualizationState,
  getHistogramPointerState,
  isHistogramAreaCandidate,
} from './area-view'

describe('histogram area view', () => {
  it('derives the active rectangle from a monotonic-stack pop', () => {
    expect(
      getHistogramPointerState([2, 1, 5, 6, 2, 3, 0], {
        i: 4,
        stack: [1],
        ans: 6,
        mid: 2,
        h: 5,
        leftSmallIndex: 1,
        width: 2,
      })
    ).toEqual({
      mode: 'histogram',
      currentIndex: 4,
      stackIndices: [1],
      bestArea: 6,
      rectangle: {
        poppedIndex: 2,
        leftIndex: 2,
        rightIndex: 3,
        height: 5,
        width: 2,
        area: 10,
      },
    })
  })

  it('rejects stale rectangle locals while keeping valid stack state', () => {
    expect(
      getHistogramPointerState([2, 1, 5, 6, 2, 3, 0], {
        i: 5,
        stack: [1, 4, 5],
        ans: 10,
        mid: 2,
        h: 5,
        leftSmallIndex: 1,
        width: 2,
      })
    ).toEqual({
      mode: 'histogram',
      currentIndex: 5,
      stackIndices: [1, 4, 5],
      bestArea: 10,
      rectangle: undefined,
    })
  })

  it('resolves a histogram snapshot through the shared area view', () => {
    const executionState: ExecutionState = {
      currentStep: 1,
      totalSteps: 2,
      isComplete: false,
      steps: [
        {
          stepNumber: 0,
          type: 'function-call',
          line: 0,
          description: 'Function called',
          variables: { heights: [2, 1, 5, 6, 2, 3] },
          timestamp: 0,
        },
        {
          stepNumber: 1,
          type: 'assignment',
          line: 9,
          description: 'ans = Math.max(ans, h * width)',
          variables: {
            hs: [2, 1, 5, 6, 2, 3, 0],
            stack: [1],
            i: 4,
            ans: 10,
            mid: 2,
            h: 5,
            leftSmallIndex: 1,
            width: 2,
          },
          timestamp: 1,
        },
      ],
    }

    expect(
      getAreaVisualizationState({
        executionState,
        variableName: 'hs',
      })
    ).toEqual({
      data: [2, 1, 5, 6, 2, 3, 0],
      areaState: expect.objectContaining({
        mode: 'histogram',
        bestArea: 10,
        rectangle: expect.objectContaining({ area: 10 }),
      }),
    })
    expect(
      isHistogramAreaCandidate(
        'hs',
        executionState.steps[1].variables.hs,
        executionState.steps[1].variables
      )
    ).toBe(true)
  })
})
