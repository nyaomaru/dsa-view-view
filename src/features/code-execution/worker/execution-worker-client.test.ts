import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'
import {
  executeCodeInWorker,
  ExecutionWorkerAbortedError,
  type ExecutionWorker,
} from './execution-worker-client'
import type {
  ExecutionWorkerRequest,
  ExecutionWorkerResponse,
} from './execution-worker-protocol'

const executionState: ExecutionState = {
  currentStep: 0,
  totalSteps: 1,
  steps: [
    {
      stepNumber: 0,
      type: 'return',
      line: 1,
      description: 'Returned: 1',
      variables: { result: 1 },
      timestamp: 1,
    },
  ],
  isComplete: false,
  returnValue: 1,
}

function createWorkerHarness() {
  const listeners = new Map<string, (event: MessageEvent<unknown>) => void>()
  let request: ExecutionWorkerRequest | undefined
  let terminated = false
  const addEventListener = ((
    type: string,
    listener: (event: MessageEvent<unknown>) => void
  ) => {
    listeners.set(type, listener)
  }) as ExecutionWorker['addEventListener']
  const worker: ExecutionWorker = {
    addEventListener,
    postMessage: (message) => {
      request = message
    },
    terminate: () => {
      terminated = true
    },
  }

  return {
    worker,
    getRequest: () => request,
    isTerminated: () => terminated,
    emitMessage: (response: unknown) => {
      listeners.get('message')?.(
        new MessageEvent('message', { data: response })
      )
    },
  }
}

describe('executeCodeInWorker', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns validated execution state and terminates the worker', async () => {
    const harness = createWorkerHarness()
    const resultPromise = executeCodeInWorker(
      'function answer() { return 1 }',
      {},
      'answer',
      'typescript',
      { createWorker: () => harness.worker }
    )
    const request = harness.getRequest()

    expect(request).toBeDefined()
    harness.emitMessage({
      type: 'success',
      requestId: request!.requestId,
      state: executionState,
    } satisfies ExecutionWorkerResponse)

    await expect(resultPromise).resolves.toEqual(executionState)
    expect(harness.isTerminated()).toBe(true)
  })

  it('rejects invalid messages and terminates the worker', async () => {
    const harness = createWorkerHarness()
    const resultPromise = executeCodeInWorker('', {}, undefined, 'typescript', {
      createWorker: () => harness.worker,
    })

    harness.emitMessage({ type: 'success', state: executionState })

    await expect(resultPromise).rejects.toThrow(
      'Worker returned an invalid response.'
    )
    expect(harness.isTerminated()).toBe(true)
  })

  it('terminates execution after the wall-clock timeout', async () => {
    vi.useFakeTimers()
    const harness = createWorkerHarness()
    const resultPromise = executeCodeInWorker('', {}, undefined, 'typescript', {
      createWorker: () => harness.worker,
      timeoutMs: 25,
    })
    const rejection = expect(resultPromise).rejects.toThrow(
      'timed out after 25 ms'
    )

    await vi.advanceTimersByTimeAsync(25)

    await rejection
    expect(harness.isTerminated()).toBe(true)
  })

  it('terminates execution when it is aborted', async () => {
    const harness = createWorkerHarness()
    const controller = new AbortController()
    const resultPromise = executeCodeInWorker('', {}, undefined, 'typescript', {
      createWorker: () => harness.worker,
      signal: controller.signal,
    })

    controller.abort()

    await expect(resultPromise).rejects.toBeInstanceOf(
      ExecutionWorkerAbortedError
    )
    expect(harness.isTerminated()).toBe(true)
  })
})
