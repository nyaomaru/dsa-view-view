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

  it('allows one-past-end cursors for final stack flushes', () => {
    expect(
      getHistogramPointerState([2, 1, 2], {
        i: 3,
        stack: [],
        ans: 3,
        mid: 1,
        h: 1,
        leftSmallIndex: -1,
        width: 3,
      })
    ).toEqual({
      mode: 'histogram',
      currentIndex: 3,
      stackIndices: [],
      bestArea: 3,
      rectangle: {
        poppedIndex: 1,
        leftIndex: 0,
        rightIndex: 2,
        height: 1,
        width: 3,
        area: 3,
      },
    })
  })

  it('still rejects out-of-range stack entries during a final flush', () => {
    expect(
      getHistogramPointerState([2, 1, 2], {
        i: 3,
        stack: [3],
        ans: 3,
      })
    ).toBeNull()
  })

  it('keeps a best rectangle discovered only during the final flush', () => {
    const heights = [2, 1, 2]
    const executionState: ExecutionState = {
      currentStep: 2,
      totalSteps: 3,
      isComplete: true,
      steps: [
        {
          stepNumber: 0,
          type: 'loop-iteration',
          line: 6,
          description: 'for (...; i < heights.length; ...)',
          variables: { heights, stack: [], i: 0, ans: 0 },
          timestamp: 0,
        },
        {
          stepNumber: 1,
          type: 'assignment',
          line: 16,
          description: 'ans = Math.max(ans, h * width)',
          variables: {
            heights,
            stack: [],
            i: heights.length,
            ans: 3,
            mid: 1,
            h: 1,
            leftSmallIndex: -1,
            width: 3,
          },
          timestamp: 1,
        },
        {
          stepNumber: 2,
          type: 'return',
          line: 19,
          description: 'return ans',
          variables: {
            heights,
            stack: [],
            i: heights.length,
            ans: 3,
          },
          timestamp: 2,
        },
      ],
    }

    expect(
      getAreaVisualizationState({
        executionState,
        variableName: 'heights',
        targetStepIndex: 0,
      })
    ).toEqual({
      data: heights,
      areaState: expect.objectContaining({
        mode: 'histogram',
        bestArea: 3,
        rectangle: expect.objectContaining({
          area: 3,
          leftIndex: 0,
          rightIndex: 2,
        }),
      }),
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

  it('preserves the best rectangle when the final loop index is invalid', () => {
    const hs = [2, 1, 5, 6, 2, 3, 0]
    const executionState: ExecutionState = {
      currentStep: 3,
      totalSteps: 4,
      isComplete: true,
      steps: [
        {
          stepNumber: 0,
          type: 'loop-iteration',
          line: 6,
          description: 'for (...; i < hs.length; ...)',
          variables: { hs, stack: [], i: 0, ans: 0 },
          timestamp: 0,
        },
        {
          stepNumber: 1,
          type: 'assignment',
          line: 12,
          description: 'ans = Math.max(ans, h * width)',
          variables: {
            hs,
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
        {
          stepNumber: 2,
          type: 'array-mutation',
          line: 14,
          description: 'stack.push(i)',
          variables: { hs, stack: [6], i: 6, ans: 10 },
          timestamp: 2,
        },
        {
          stepNumber: 3,
          type: 'return',
          line: 17,
          description: 'return ans',
          variables: { hs, stack: [6], i: hs.length, ans: 10 },
          timestamp: 3,
        },
      ],
    }

    expect(
      getAreaVisualizationState({
        executionState,
        variableName: 'hs',
        targetStepIndex: 0,
      })
    ).toEqual({
      data: hs,
      areaState: expect.objectContaining({
        mode: 'histogram',
        bestArea: 10,
        stackIndices: [1],
        rectangle: expect.objectContaining({
          area: 10,
          leftIndex: 2,
          rightIndex: 3,
        }),
      }),
    })
  })
})
