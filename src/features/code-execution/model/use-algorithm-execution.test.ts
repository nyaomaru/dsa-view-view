// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { EXECUTION_CONSTANTS } from './constants'
import { useAlgorithmExecution } from './use-algorithm-execution'

function createStep(stepNumber: number): ExecutionStep {
  return {
    stepNumber,
    type: 'assignment',
    line: stepNumber + 1,
    description: `Step ${stepNumber}`,
    variables: {},
    timestamp: stepNumber,
  }
}

const completeExecutionState: ExecutionState = {
  currentStep: 2,
  totalSteps: 3,
  steps: [createStep(0), createStep(1), createStep(2)],
  isComplete: true,
}

describe('useAlgorithmExecution', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('restarts playback from the first step when run all is clicked after completion', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useAlgorithmExecution())

    act(() => {
      result.current.setExecutionState(completeExecutionState)
    })

    act(() => {
      result.current.handleRunAll()
    })

    expect(result.current.executionState?.currentStep).toBe(0)
    expect(result.current.executionState?.isComplete).toBe(false)
    expect(result.current.isRunning).toBe(true)

    act(() => {
      vi.advanceTimersByTime(EXECUTION_CONSTANTS.EXECUTION_INTERVAL_MS)
    })

    expect(result.current.executionState?.currentStep).toBe(1)
  })
})
