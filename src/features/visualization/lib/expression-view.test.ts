import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import {
  getExpressionStepIndex,
  getExpressionVisualizationState,
} from './expression-view'

function createStep(
  stepNumber: number,
  variables: Record<string, unknown>
): ExecutionStep {
  return {
    stepNumber,
    type: 'assignment',
    line: stepNumber + 1,
    description: 'Calculator step',
    variables,
    timestamp: stepNumber,
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

describe('Expression View', () => {
  it('detects calculator state and follows the current character', () => {
    const steps = [
      createStep(0, { s: '1+(2-3)' }),
      createStep(1, {
        s: '1+(2-3)',
        res: 1,
        num: 0,
        sign: 1,
        stack: [1],
        i: 1,
        char: '+',
      }),
      createStep(2, {
        s: '1+(2-3)',
        res: 1,
        num: 0,
        sign: 1,
        stack: [1, 1],
        i: 2,
        char: '(',
      }),
    ]
    const state = createState(2, steps)

    expect(getExpressionStepIndex(state)).toBe(1)
    expect(getExpressionVisualizationState(state)).toEqual({
      expression: '1+(2-3)',
      index: 2,
      currentChar: '(',
      result: 1,
      currentNumber: 0,
      sign: 1,
      signStack: [1, 1],
      action: 'Entering parentheses',
    })
  })

  it('uses the detected step while playback has not reached local state yet', () => {
    const steps = [
      createStep(0, { expression: '1-2' }),
      createStep(1, {
        expression: '1-2',
        result: 0,
        currentNumber: 1,
        sign: 1,
        signStack: [1],
        index: 0,
      }),
    ]
    const state = createState(0, steps)

    expect(getExpressionVisualizationState(state, 1)?.currentChar).toBe('1')
    expect(getExpressionVisualizationState(state, 1)?.action).toBe(
      'Reading digit'
    )
  })

  it('rejects unrelated strings and numeric stacks', () => {
    const state = createState(0, [
      createStep(0, {
        s: 'hello',
        res: 0,
        num: 0,
        sign: 1,
        stack: [1],
      }),
    ])

    expect(getExpressionStepIndex(state)).toBeUndefined()
    expect(getExpressionVisualizationState(state)).toBeNull()
  })
})
