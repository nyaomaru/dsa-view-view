import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { detectVisualizationState } from './detect-visualization-state'

function createStep(
  stepNumber: number,
  description: string,
  variables: Record<string, unknown>,
  callStack?: string[]
): ExecutionStep {
  return {
    stepNumber,
    type: 'assignment',
    line: stepNumber + 1,
    description,
    variables,
    timestamp: stepNumber,
    callStack,
  }
}

function createExecutionState(
  steps: ExecutionStep[],
  returnValue?: unknown
): ExecutionState {
  return {
    currentStep: steps.length - 1,
    totalSteps: steps.length,
    steps,
    isComplete: false,
    returnValue,
  }
}

describe('detectVisualizationState', () => {
  it('selects a mutated numeric array only for sorting traces', () => {
    const sortingState = createExecutionState([
      createStep(0, 'Initial values', { nums: [2, 1] }),
      createStep(1, 'swap nums[0] and nums[1]', { nums: [1, 2] }),
    ])
    const nonSortingState = createExecutionState([
      createStep(0, 'Initial values', { nums: [2, 1] }),
      createStep(1, 'Updated values', { nums: [1, 2] }),
    ])

    expect(detectVisualizationState(sortingState).primaryArrayName).toBe('nums')
    expect(
      detectVisualizationState(nonSortingState).primaryArrayName
    ).toBeUndefined()
  })

  it('distinguishes mutated matrices from adjacency-list graphs', () => {
    const state = createExecutionState([
      createStep(0, 'Initial values', {
        grid: [
          [0, 0],
          [0, 0],
        ],
        graph: [[1], [0, 2], [1]],
      }),
      createStep(1, 'grid[0][0] = 1', {
        grid: [
          [1, 0],
          [0, 0],
        ],
        graph: [[1], [0, 2], [1]],
      }),
    ])
    const detection = detectVisualizationState(state)

    expect(detection.primaryMatrixName).toBe('grid')
    expect(detection.primaryGraphName).toBe('graph')
  })

  it('prefers a numeric result stack over buckets that become ragged', () => {
    const state = createExecutionState([
      createStep(0, 'Created buckets', {
        buckets: [[], [], [], []],
        result: [],
      }),
      createStep(1, 'result.push(num)', {
        buckets: [[], [3], [1, 2], []],
        result: [1, 2],
      }),
    ])
    const detection = detectVisualizationState(state)

    expect(detection.primaryStackName).toBe('result')
    expect(detection.primaryGraphName).toBeUndefined()
    expect(detection.primaryMatrixName).toBeUndefined()
  })

  it('does not treat the final worker result as a growing result stack', () => {
    const state = createExecutionState([
      createStep(0, 'Function called', { nums: [2, 7, 11, 15] }),
      createStep(1, 'Returned: [0,1]', {
        nums: [2, 7, 11, 15],
        result: [0, 1],
      }),
    ])

    expect(detectVisualizationState(state).primaryStackName).toBeUndefined()
  })

  it('selects a mutated answer array as the primary stack', () => {
    const state = createExecutionState([
      createStep(0, 'Filled prefix products', {
        nums: [1, 2, 3, 4],
        answer: [1, 1, 2, 6],
      }),
      createStep(1, 'Applied suffix products', {
        nums: [1, 2, 3, 4],
        answer: [24, 12, 8, 6],
      }),
    ])

    expect(detectVisualizationState(state).primaryStackName).toBe('answer')
  })

  it('handles cyclic list nodes while selecting list candidates', () => {
    const head: Record<string, unknown> = { val: 1, next: null }
    head.next = head
    const state = createExecutionState([
      createStep(0, 'Initial values', { head }),
    ])
    const detection = detectVisualizationState(state)

    expect(detection.primaryListNodeName).toBe('head')
    expect(detection.visualizableListNodeNames).toEqual(['head'])
  })

  it('selects cyclic graph-node return values for Graph View', () => {
    const one = { val: 1, neighbors: [] as unknown[] }
    const two = { val: 2, neighbors: [one] }
    one.neighbors.push(two)
    const state = createExecutionState(
      [createStep(0, 'Returned graph clone', { node: one })],
      one
    )

    expect(detectVisualizationState(state).primaryGraphName).toBe(
      'return value'
    )
  })

  it('classifies class-design and recursive call-stack traces', () => {
    const state = createExecutionState([
      createStep(
        0,
        'Function called with: __algorithmVisualizerClassDesignInput',
        {},
        ['root', 'LRUCache', 'put']
      ),
    ])
    const detection = detectVisualizationState(state)

    expect(detection.isClassDesignTrace).toBe(true)
    expect(detection.hasRecursion).toBe(true)
  })
})
