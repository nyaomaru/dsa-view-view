import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { STEP_TYPES } from '@/entities/execution'
import { describe, expect, it } from 'vite-plus/test'
import {
  getZigzagStepIndex,
  getZigzagStepState,
  getZigzagVisualizationState,
} from './zigzag-view'

function step(variables: Record<string, unknown>): ExecutionStep {
  return {
    stepNumber: 0,
    type: STEP_TYPES.VARIABLE_DECLARATION,
    line: 1,
    description: '',
    variables,
    timestamp: 0,
  }
}

describe('Zigzag visualization state', () => {
  it('recognizes the standard row buffers and tracks the current placement', () => {
    const firstPlacement = step({
      s: 'PAYPALISHIRING',
      numRows: 3,
      rows: ['P', '', ''],
      row: 1,
      direction: 1,
    })
    const thirdPlacement = step({
      s: 'PAYPALISHIRING',
      numRows: 3,
      rows: ['P', 'A', 'Y'],
      row: 1,
      direction: -1,
    })
    const state: ExecutionState = {
      currentStep: 1,
      totalSteps: 2,
      steps: [firstPlacement, thirdPlacement],
      isComplete: false,
    }

    expect(getZigzagStepState(thirdPlacement)).toMatchObject({
      rows: ['P', 'A', 'Y'],
      processedCharacterCount: 3,
      row: 1,
      direction: -1,
    })
    expect(getZigzagStepIndex(state)).toBe(0)
    expect(getZigzagVisualizationState(state)?.rows.join('')).toBe('PAY')
  })

  it('rejects row buffers that do not follow the source zigzag path', () => {
    expect(
      getZigzagStepState(
        step({
          s: 'PAYPALISHIRING',
          numRows: 3,
          rows: ['PA', 'Y', ''],
          row: 1,
          direction: 1,
        })
      )
    ).toBeNull()
  })
})
