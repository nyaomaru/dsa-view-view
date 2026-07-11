import { executeCode } from '../lib/runner'
import {
  isExecutionWorkerRequest,
  type ExecutionWorkerResponse,
} from './execution-worker-protocol'
import { isError } from '@/shared/lib/guards'

type WorkerScope = {
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<unknown>) => void
  ) => void
  postMessage: (message: ExecutionWorkerResponse) => void
}

const workerScope = globalThis as unknown as WorkerScope
const postMessageToHost = workerScope.postMessage.bind(workerScope)

function sendResponse(response: ExecutionWorkerResponse): void {
  try {
    postMessageToHost(response)
  } catch {
    postMessageToHost({
      type: 'failure',
      requestId: response.requestId,
      message: 'Execution produced a value that cannot leave the worker.',
    })
  }
}

workerScope.addEventListener('message', (event) => {
  if (!isExecutionWorkerRequest(event.data)) return

  const request = event.data

  try {
    const state = executeCode(
      request.code,
      request.inputs,
      request.entryFunctionName,
      request.language
    )
    sendResponse({ type: 'success', requestId: request.requestId, state })
  } catch (error) {
    sendResponse({
      type: 'failure',
      requestId: request.requestId,
      message: isError(error) ? error.message : 'Execution failed',
    })
  }
})
