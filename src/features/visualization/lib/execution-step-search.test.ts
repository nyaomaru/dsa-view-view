import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'

import { getExecutionStepSearchOrder } from './execution-step-search'

const executionState: ExecutionState = {
  currentStep: 2,
  totalSteps: 5,
  isComplete: false,
  steps: Array.from({ length: 5 }, (_, stepNumber) => ({
    stepNumber,
    type: 'assignment',
    line: stepNumber + 1,
    description: `step ${stepNumber}`,
    variables: {},
    timestamp: stepNumber,
  })),
}

describe('getExecutionStepSearchOrder', () => {
  it('deduplicates the preferred target and searches future steps first', () => {
    expect(
      getExecutionStepSearchOrder({ executionState, targetStepIndex: 4 })
    ).toEqual([2, 4, 3, 1, 0])
  })

  it('can search past steps first and excludes invalid targets', () => {
    expect(
      getExecutionStepSearchOrder({
        executionState,
        targetStepIndex: 99,
        preferPastSteps: true,
      })
    ).toEqual([2, 1, 0, 3, 4])
  })

  it('can exclude future steps while preserving an explicit target', () => {
    expect(
      getExecutionStepSearchOrder({
        executionState,
        targetStepIndex: 4,
        preferPastSteps: true,
        includeFutureSteps: false,
      })
    ).toEqual([2, 4, 1, 0])
  })
})
