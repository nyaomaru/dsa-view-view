// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { EXECUTION_CONSTANTS } from './constants'
import { useAlgorithmExecution } from './use-algorithm-execution'
import { executeCodeInWorker } from '../worker/execution-worker-client'

vi.mock('../worker/execution-worker-client', () => ({
  executeCodeInWorker: vi.fn(),
}))

const executeCodeInWorkerMock = vi.mocked(executeCodeInWorker)

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
    vi.resetAllMocks()
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

  it('stores execution state returned by the worker', async () => {
    executeCodeInWorkerMock.mockResolvedValue(completeExecutionState)
    const { result } = renderHook(() => useAlgorithmExecution())

    await act(async () => {
      await result.current.startExecution('function run() {}', {}, 'run')
    })

    expect(result.current.executionState).toEqual(completeExecutionState)
  })

  it('surfaces worker failures as execution errors', async () => {
    executeCodeInWorkerMock.mockRejectedValue(new Error('Worker exploded.'))
    const { result } = renderHook(() => useAlgorithmExecution())

    await act(async () => {
      await result.current.startExecution('function run() {}', {}, 'run')
    })

    expect(result.current.executionState?.error).toBe('Worker exploded.')
    expect(result.current.executionState?.steps[0]?.description).toBe(
      'Error: Worker exploded.'
    )
  })

  it('aborts pending worker execution when execution is cleared', async () => {
    executeCodeInWorkerMock.mockImplementation(
      (_code, _inputs, _entryFunctionName, _language, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'))
          })
        })
    )
    const { result } = renderHook(() => useAlgorithmExecution())
    let executionPromise: Promise<ExecutionState | null>

    act(() => {
      executionPromise = result.current.startExecution(
        'function run() {}',
        {},
        'run'
      )
    })
    act(() => {
      result.current.clearExecution()
    })
    await act(async () => {
      await executionPromise
    })

    expect(result.current.executionState).toBeNull()
  })
})
