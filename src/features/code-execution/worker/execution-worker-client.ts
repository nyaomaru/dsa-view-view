import type { SupportedLanguage } from '@/entities/code'
import type { ExecutionState, InputValues } from '@/entities/execution'
import { isError } from '@/shared/lib/guards'
import {
  isExecutionWorkerResponse,
  type ExecutionWorkerRequest,
} from './execution-worker-protocol'

export const EXECUTION_WORKER_TIMEOUT_MS = 10_000

type WorkerMessageListener = (event: MessageEvent<unknown>) => void
type WorkerErrorListener = (event: ErrorEvent) => void
type WorkerMessageErrorListener = (event: MessageEvent<unknown>) => void

export type ExecutionWorker = {
  postMessage: (message: ExecutionWorkerRequest) => void
  terminate: () => void
  addEventListener: {
    (type: 'message', listener: WorkerMessageListener): void
    (type: 'error', listener: WorkerErrorListener): void
    (type: 'messageerror', listener: WorkerMessageErrorListener): void
  }
}

export type ExecuteInWorkerOptions = {
  signal?: AbortSignal
  timeoutMs?: number
  createWorker?: () => ExecutionWorker
}

function createExecutionWorker(): ExecutionWorker {
  return new Worker(new URL('./execution-worker.ts', import.meta.url), {
    type: 'module',
    name: 'algorithm-execution',
  })
}

function getWorkerErrorMessage(event: ErrorEvent): string {
  return event.message || 'The execution worker failed.'
}

export class ExecutionWorkerAbortedError extends Error {
  constructor() {
    super('Execution was cancelled.')
    this.name = 'ExecutionWorkerAbortedError'
  }
}

export function executeCodeInWorker(
  code: string,
  inputs: InputValues,
  entryFunctionName: string | undefined,
  language: SupportedLanguage,
  {
    signal,
    timeoutMs = EXECUTION_WORKER_TIMEOUT_MS,
    createWorker = createExecutionWorker,
  }: ExecuteInWorkerOptions = {}
): Promise<ExecutionState> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID()
    const worker = createWorker()
    let settled = false

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', handleAbort)
      worker.terminate()
      callback()
    }
    const handleAbort = () => {
      finish(() => reject(new ExecutionWorkerAbortedError()))
    }
    const timeoutId = setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            `Execution timed out after ${timeoutMs.toLocaleString()} ms.`
          )
        )
      )
    }, timeoutMs)

    worker.addEventListener('message', (event) => {
      if (!isExecutionWorkerResponse(event.data)) {
        finish(() => reject(new Error('Worker returned an invalid response.')))
        return
      }
      const response = event.data
      if (response.requestId !== requestId) return

      if (response.type === 'success') {
        finish(() => resolve(response.state))
        return
      }

      finish(() => reject(new Error(response.message)))
    })
    worker.addEventListener('error', (event) => {
      finish(() => reject(new Error(getWorkerErrorMessage(event))))
    })
    worker.addEventListener('messageerror', () => {
      finish(() => reject(new Error('Worker response could not be read.')))
    })
    signal?.addEventListener('abort', handleAbort, { once: true })

    if (signal?.aborted) {
      handleAbort()
      return
    }

    try {
      worker.postMessage({
        type: 'execute',
        requestId,
        code,
        inputs,
        entryFunctionName,
        language,
      })
    } catch (error) {
      finish(() =>
        reject(isError(error) ? error : new Error('Worker could not start.'))
      )
    }
  })
}
