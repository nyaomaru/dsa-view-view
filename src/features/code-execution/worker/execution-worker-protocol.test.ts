import { describe, expect, it } from 'vite-plus/test'
import {
  isExecutionWorkerRequest,
  isExecutionWorkerResponse,
} from './execution-worker-protocol'

describe('execution worker protocol', () => {
  it('accepts execution requests containing cyclic inputs', () => {
    const node: Record<string, unknown> = { val: 1 }
    node.next = node

    expect(
      isExecutionWorkerRequest({
        type: 'execute',
        requestId: 'request-1',
        code: 'function hasCycle() { return true }',
        inputs: { head: node },
        entryFunctionName: 'hasCycle',
        language: 'typescript',
      })
    ).toBe(true)
  })

  it('rejects malformed worker responses', () => {
    expect(
      isExecutionWorkerResponse({
        type: 'success',
        requestId: 'request-1',
        state: { steps: 'not-an-array' },
      })
    ).toBe(false)
  })
})
