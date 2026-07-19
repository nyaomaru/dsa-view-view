import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import {
  findPreviousVariableChange,
  getVariableChangeAtStep,
} from './variable-change-navigation'

function createState(values: Array<Record<string, unknown>>): ExecutionState {
  const steps: ExecutionStep[] = values.map((variables, stepNumber) => ({
    stepNumber,
    type: 'assignment',
    line: stepNumber + 1,
    description: `Step ${stepNumber}`,
    variables,
    timestamp: stepNumber,
  }))

  return {
    currentStep: steps.length - 1,
    totalSteps: steps.length,
    steps,
    isComplete: true,
  }
}

describe('variable change navigation', () => {
  it('finds the nearest earlier pointer change and its adjacent values', () => {
    const state = createState([
      { left: 0 },
      { left: 0 },
      { left: 1 },
      { left: 1 },
      { left: 2 },
      { left: 2 },
    ])

    expect(findPreviousVariableChange(state, 'left', 5)).toEqual({
      stepIndex: 4,
      previousValue: 1,
      currentValue: 2,
    })
    expect(findPreviousVariableChange(state, 'left', 4)).toEqual({
      stepIndex: 2,
      previousValue: 0,
      currentValue: 1,
    })
  })

  it('ignores structurally equal object snapshots', () => {
    const state = createState([
      { values: [1, 2] },
      { values: [1, 2] },
      { values: [1, 2] },
      { values: [2, 1] },
      { values: [2, 1] },
    ])

    expect(findPreviousVariableChange(state, 'values', 4)).toEqual({
      stepIndex: 3,
      previousValue: [1, 2],
      currentValue: [2, 1],
    })
  })

  it('preserves non-JSON numeric values when comparing snapshots', () => {
    const state = createState([
      { distances: [Infinity] },
      { distances: [NaN] },
      { distances: [null] },
    ])

    expect(getVariableChangeAtStep(state, 'distances', 1)).toEqual({
      stepIndex: 1,
      previousValue: [Infinity],
      currentValue: [NaN],
    })
    expect(getVariableChangeAtStep(state, 'distances', 2)).toEqual({
      stepIndex: 2,
      previousValue: [NaN],
      currentValue: [null],
    })
  })

  it('compares BigInt-containing snapshots without stringifying them', () => {
    const state = createState([
      { result: { value: 1n } },
      { result: { value: 1n } },
      { result: { value: 2n } },
    ])

    expect(getVariableChangeAtStep(state, 'result', 1)).toBeUndefined()
    expect(getVariableChangeAtStep(state, 'result', 2)).toEqual({
      stepIndex: 2,
      previousValue: { value: 1n },
      currentValue: { value: 2n },
    })
  })

  it('does not treat a variable entering the snapshot as a value change', () => {
    const state = createState([{}, { right: 4 }, { right: 4 }])

    expect(findPreviousVariableChange(state, 'right', 2)).toBeUndefined()
    expect(getVariableChangeAtStep(state, 'right', 1)).toBeUndefined()
  })

  it('returns the transition at the selected change step', () => {
    const state = createState([{ i: 0 }, { i: 1 }, { i: 1 }])

    expect(getVariableChangeAtStep(state, 'i', 1)).toEqual({
      stepIndex: 1,
      previousValue: 0,
      currentValue: 1,
    })
    expect(getVariableChangeAtStep(state, 'i', 2)).toBeUndefined()
  })

  it('stops scanning after the nearest earlier change', () => {
    const currentStep = 100
    const materializedSteps = new Set<number>()
    const steps = Array.from({ length: 3_000 }, (_, stepNumber) => {
      const step = {
        stepNumber,
        type: 'assignment',
        line: stepNumber + 1,
        description: `Step ${stepNumber}`,
        variables: {},
        timestamp: stepNumber,
      } as ExecutionStep

      Object.defineProperty(step, 'variables', {
        get: () => {
          if (stepNumber > currentStep) {
            throw new Error('A future variable snapshot was materialized')
          }

          materializedSteps.add(stepNumber)
          return { left: stepNumber >= 98 ? 1 : 0 }
        },
      })

      return step
    })
    const state: ExecutionState = {
      currentStep,
      totalSteps: steps.length,
      steps,
      isComplete: true,
    }

    expect(findPreviousVariableChange(state, 'left', currentStep)).toEqual({
      stepIndex: 98,
      previousValue: 0,
      currentValue: 1,
    })
    expect([...materializedSteps]).toEqual([98, 99, 97])
  })
})
