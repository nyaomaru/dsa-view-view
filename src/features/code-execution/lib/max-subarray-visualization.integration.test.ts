import { describe, expect, it } from 'vite-plus/test'
import {
  getMaxSubarrayTraceCandidate,
  getMaxSubarrayVisualizationState,
} from '@/features/visualization/lib/max-subarray-view'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { executeCode } from './runner'

const input = { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }

describe('Maximum-subarray visualization integration', () => {
  it('exposes the current position and both Kadane accumulators', () => {
    const state = executeCode(
      `
function maxSubArray(nums: number[]): number {
  if (nums.length === 0) return 0

  let maxEndingHere = nums[0]
  let maxSoFar = nums[0]

  for (let i = 1; i < nums.length; i++) {
    const x = nums[i]

    maxEndingHere = Math.max(x, maxEndingHere + x)
    maxSoFar = Math.max(maxSoFar, maxEndingHere)
  }
  return maxSoFar
}
`,
      input,
      'maxSubArray'
    )
    const currentStep = state.steps.findIndex(
      (step) =>
        step.variables.i === 6 &&
        step.variables.maxEndingHere === 6 &&
        step.variables.maxSoFar === 6
    )
    const candidate = getMaxSubarrayTraceCandidate(state)
    const view = getMaxSubarrayVisualizationState({
      executionState: { ...state, currentStep },
      variableName: 'nums',
      targetStepIndex: candidate?.stepIndex,
    })
    const lastStep = state.steps[state.steps.length - 1]
    const completedView = getMaxSubarrayVisualizationState({
      executionState: {
        ...state,
        currentStep: state.steps.length,
        steps: [
          ...state.steps,
          {
            ...lastStep,
            stepNumber: lastStep.stepNumber + 1,
            variables: {
              nums: input.nums,
              maxEndingHere: 5,
              maxSoFar: 6,
            },
          },
        ],
      },
      variableName: 'nums',
      targetStepIndex: candidate?.stepIndex,
    })

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(6)
    expect(currentStep).toBeGreaterThanOrEqual(0)
    expect(candidate).toMatchObject({
      name: 'nums',
      indexName: 'i',
      endingName: 'maxEndingHere',
      bestName: 'maxSoFar',
    })
    expect(detectVisualizationState(state)).toMatchObject({
      primaryMaxSubarrayArrayName: 'nums',
      primaryMaxSubarrayStepIndex: candidate?.stepIndex,
    })
    expect(view).toMatchObject({
      currentIndex: 6,
      currentValue: 1,
      maxEndingHere: 6,
      maxSoFar: 6,
    })
    expect(completedView).toMatchObject({
      currentIndex: 8,
      currentValue: 4,
      maxEndingHere: 5,
      maxSoFar: 6,
    })
  })

  it('infers Kadane state when the variables use different names', () => {
    const state = executeCode(
      `
function maxSubArray(nums: number[]): number {
  let endingAtPosition = nums[0]
  let bestSum = nums[0]

  for (let position = 1; position < nums.length; position++) {
    const value = nums[position]
    endingAtPosition = Math.max(value, endingAtPosition + value)
    bestSum = Math.max(bestSum, endingAtPosition)
  }

  return bestSum
}
`,
      input,
      'maxSubArray'
    )

    expect(getMaxSubarrayTraceCandidate(state)).toMatchObject({
      name: 'nums',
      indexName: 'position',
      endingName: 'endingAtPosition',
      bestName: 'bestSum',
    })
  })

  it('does not classify unrelated running totals as Kadane state', () => {
    const state = executeCode(
      `
function sumAndMax(nums: number[]): number {
  let sum = 0
  let maximum = nums[0]

  for (let index = 0; index < nums.length; index++) {
    sum += nums[index]
    maximum = Math.max(maximum, nums[index])
  }

  return sum + maximum
}
`,
      input,
      'sumAndMax'
    )

    expect(getMaxSubarrayTraceCandidate(state)).toBeUndefined()
  })
})
