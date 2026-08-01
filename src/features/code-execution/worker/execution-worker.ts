import {
  isExecutionWorkerRequest,
  type ExecutionWorkerResponse,
} from './execution-worker-protocol'
import { handleExecutionWorkerRequest } from './execution-worker-handler'
import { createWorkerTransferValue } from './worker-transfer'

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
    try {
      postMessageToHost(createWorkerTransferValue(response))
    } catch {
      postMessageToHost({
        type: 'failure',
        requestId: response.requestId,
        message: 'Execution produced a value that cannot leave the worker.',
      })
    }
  }
}

workerScope.addEventListener('message', async (event) => {
  if (!isExecutionWorkerRequest(event.data)) return

  sendResponse(await handleExecutionWorkerRequest(event.data))
})
