import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState, ExecutionStep, RuntimeComparison } from '@/entities/execution'
import { getContextualRuntimeComparison } from './runtime-comparison'

const binaryComparison: RuntimeComparison = {
  left: { expression: 'nums[mid]', value: 5 },
  operator: '<',
  right: { expression: 'target', value: 7 },
  result: true,
}

const capacityComparison: RuntimeComparison = {
  left: { expression: 'current + weight', value: 12 },
  operator: '>',
  right: { expression: 'capacity', value: 10 },
  result: true,
}

const windowComparison: RuntimeComparison = {
  left: { expression: 'right', value: 3 },
  operator: '<',
  right: { expression: 'chars.length', value: 4 },
  result: true,
}

function createStep({
  stepNumber,
  comparison,
  frameId,
  functionName,
  scope,
}: {
  stepNumber: number
  comparison?: RuntimeComparison
  frameId?: number
  functionName?: string
  scope?: string
}): ExecutionStep {
  return {
    stepNumber,
    type: 'condition',
    line: stepNumber + 1,
    description: 'comparison',
    variables: {},
    timestamp: stepNumber,
    scope,
    metadata: {
      ...(comparison ? { comparison } : {}),
      ...(frameId !== undefined
        ? {
            callFrame: {
              frameId,
              functionName: functionName ?? 'algorithm',
              phase: 'update',
              visibleVariableNames: [],
            },
          }
        : functionName
          ? { functionName }
          : {}),
    },
  }
}

function createState(steps: ExecutionStep[], currentStep = steps.length - 1): ExecutionState {
  return {
    currentStep,
    totalSteps: steps.length,
    isComplete: false,
    steps,
  }
}

describe('getContextualRuntimeComparison', () => {
  it('keeps the latest binary-search comparison through unrelated execution steps', () => {
    const state = createState([
      createStep({
        stepNumber: 0,
        comparison: binaryComparison,
        frameId: 1,
        functionName: 'binarySearch',
      }),
      createStep({ stepNumber: 1, frameId: 1, functionName: 'binarySearch' }),
    ])

    expect(
      getContextualRuntimeComparison(state, {
        variableNames: ['nums', 'left', 'right', 'mid', 'target'],
      })
    ).toBe(binaryComparison)
  })

  it('selects capacity and sliding-window comparisons by their displayed variables', () => {
    const state = createState([
      createStep({
        stepNumber: 0,
        comparison: capacityComparison,
        frameId: 1,
        functionName: 'canShip',
      }),
      createStep({
        stepNumber: 1,
        comparison: windowComparison,
        frameId: 2,
        functionName: 'lengthOfLongestSubstring',
      }),
    ])

    expect(
      getContextualRuntimeComparison(state, {
        stepIndex: 0,
        variableNames: ['weights', 'capacity', 'current', 'weight', 'days'],
      })
    ).toBe(capacityComparison)
    expect(
      getContextualRuntimeComparison(state, {
        variableNames: ['s', 'left', 'right', 'chars', 'set'],
      })
    ).toBe(windowComparison)
  })

  it('does not read a comparison from a future playback step', () => {
    const state = createState(
      [
        createStep({ stepNumber: 0, frameId: 1, functionName: 'binarySearch' }),
        createStep({
          stepNumber: 1,
          comparison: binaryComparison,
          frameId: 1,
          functionName: 'binarySearch',
        }),
      ],
      0
    )

    expect(
      getContextualRuntimeComparison(state, {
        variableNames: ['nums', 'mid', 'target'],
      })
    ).toBeUndefined()
  })

  it('uses a future target step only for context, not as a search endpoint', () => {
    const state = createState(
      [
        createStep({ stepNumber: 0, frameId: 1, functionName: 'binarySearch' }),
        createStep({
          stepNumber: 1,
          comparison: binaryComparison,
          frameId: 1,
          functionName: 'binarySearch',
        }),
      ],
      0
    )

    expect(
      getContextualRuntimeComparison(state, {
        stepIndex: 1,
        variableNames: ['nums', 'mid', 'target'],
      })
    ).toBeUndefined()
  })

  it('rejects comparisons from another call frame and preserves undefined values', () => {
    const ownComparison: RuntimeComparison = {
      left: { expression: 'nums[mid]', value: undefined },
      operator: '===',
      right: { expression: 'target', value: undefined },
      result: true,
    }
    const state = createState([
      createStep({
        stepNumber: 0,
        comparison: ownComparison,
        frameId: 1,
        functionName: 'binarySearch',
      }),
      createStep({
        stepNumber: 1,
        comparison: binaryComparison,
        frameId: 2,
        functionName: 'binarySearch',
      }),
      createStep({ stepNumber: 2, frameId: 1, functionName: 'binarySearch' }),
    ])

    expect(
      getContextualRuntimeComparison(state, {
        variableNames: ['nums', 'mid', 'target'],
      })
    ).toEqual(ownComparison)
  })

  it('uses the active algorithm segment when call-frame metadata is unavailable', () => {
    const state = createState([
      createStep({
        stepNumber: 0,
        comparison: binaryComparison,
        functionName: 'binarySearch',
      }),
      createStep({
        stepNumber: 1,
        comparison: capacityComparison,
        functionName: 'shipWithinDays',
      }),
      createStep({ stepNumber: 2, functionName: 'binarySearch' }),
    ])

    expect(
      getContextualRuntimeComparison(state, {
        variableNames: ['nums', 'mid', 'target', 'capacity'],
      })
    ).toBe(binaryComparison)
  })

  it('does not treat variable-name substrings as related expressions', () => {
    const state = createState([
      createStep({
        stepNumber: 0,
        comparison: {
          left: { expression: 'status', value: 'ready' },
          operator: '===',
          right: { expression: 'expected', value: 'ready' },
          result: true,
        },
        frameId: 1,
        functionName: 'window',
      }),
      createStep({ stepNumber: 1, frameId: 1, functionName: 'window' }),
    ])

    expect(
      getContextualRuntimeComparison(state, { variableNames: ['s'] })
    ).toBeUndefined()
  })

  it('ignores member keys and string literals that resemble visualizer variables', () => {
    const state = createState([
      createStep({
        stepNumber: 0,
        comparison: binaryComparison,
        frameId: 1,
        functionName: 'binarySearch',
      }),
      createStep({
        stepNumber: 1,
        comparison: {
          left: { expression: 'node.left', value: null },
          operator: '!==',
          right: { expression: "{ right: 'left' }", value: null },
          result: false,
        },
        frameId: 1,
        functionName: 'binarySearch',
      }),
      createStep({ stepNumber: 2, frameId: 1, functionName: 'binarySearch' }),
    ])

    expect(
      getContextualRuntimeComparison(state, {
        variableNames: ['left', 'right', 'mid', 'target'],
      })
    ).toBe(binaryComparison)
  })
})
