import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { getHeapVisualizationState } from './heap-view'

function createHeapStep(
  stepNumber: number,
  minHeap: number[],
  maxHeap: number[]
): ExecutionStep {
  return {
    stepNumber,
    type: 'array-mutation',
    line: stepNumber + 1,
    description: 'heap mutation',
    variables: {},
    timestamp: stepNumber,
    metadata: {
      heapTrace: {
        heaps: [
          { name: 'minHeap', kind: 'min', values: minHeap },
          { name: 'maxHeap', kind: 'max', values: maxHeap },
        ],
      },
    },
  }
}

function createState(
  currentStep: number,
  steps: ExecutionStep[]
): ExecutionState {
  return {
    currentStep,
    totalSteps: steps.length,
    steps,
    isComplete: false,
  }
}

describe('getHeapVisualizationState', () => {
  it('describes values moving between heaps and calculates the median', () => {
    const state = createState(1, [
      createHeapStep(0, [], [2, 1]),
      createHeapStep(1, [2], [1]),
    ])

    expect(getHeapVisualizationState(state)).toEqual({
      snapshot: state.steps[1].metadata?.heapTrace,
      action: {
        description: 'Moved 2: maxHeap → minHeap',
        value: 2,
        targetHeapName: 'minHeap',
      },
      median: 1.5,
    })
  })

  it('uses the latest past snapshot when stepping backward', () => {
    const plainStep: ExecutionStep = {
      stepNumber: 1,
      type: 'function-entry',
      line: 2,
      description: 'Entering method: findMedian',
      variables: {},
      timestamp: 1,
    }
    const state = createState(1, [
      createHeapStep(0, [3], [2, 1]),
      plainStep,
      createHeapStep(2, [3, 4], [2, 1]),
    ])

    expect(getHeapVisualizationState(state, 2)?.snapshot).toEqual(
      state.steps[0].metadata?.heapTrace
    )
  })

  it('uses the detected heap step when no snapshot exists at the current step', () => {
    const plainStep: ExecutionStep = {
      stepNumber: 0,
      type: 'function-call',
      line: 0,
      description: 'Function called',
      variables: {},
      timestamp: 0,
    }
    const state = createState(0, [plainStep, createHeapStep(1, [], [])])

    expect(getHeapVisualizationState(state, 1)?.snapshot).toEqual(
      state.steps[1].metadata?.heapTrace
    )
  })
})
