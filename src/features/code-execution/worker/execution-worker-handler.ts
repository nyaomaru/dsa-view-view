import { isError } from '@/shared/lib/guards'
import { executeCodeAsync } from '../lib/runner'
import type {
  ExecutionWorkerRequest,
  ExecutionWorkerResponse,
} from './execution-worker-protocol'

/** Executes one validated worker request through the Promise-aware runner. */
export async function handleExecutionWorkerRequest(
  request: ExecutionWorkerRequest
): Promise<ExecutionWorkerResponse> {
  try {
    const state = await executeCodeAsync(
      request.code,
      request.inputs,
      request.entryFunctionName,
      request.language
    )

    return { type: 'success', requestId: request.requestId, state }
  } catch (error) {
    return {
      type: 'failure',
      requestId: request.requestId,
      message: isError(error) ? error.message : 'Execution failed',
    }
  }
}
