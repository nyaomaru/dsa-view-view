import { describe, expect, it } from 'vite-plus/test'
import { isExecutionState, isExecutionStep } from '@/entities/execution'
import { executeCode } from '../lib/runner'
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

  it('accepts product-except-self execution states with sparse arrays', () => {
    const state = executeCode(
      `function productExceptSelf(nums: number[]): number[] {
  const answer: number[] = new Array(nums.length)
  let prefix = 1
  for (let i = 0; i < nums.length; i++) {
    answer[i] = prefix
    prefix *= nums[i]
  }
  let suffix = 1
  for (let i = nums.length - 1; i >= 0; i--) {
    answer[i] *= suffix
    suffix *= nums[i]
  }
  return answer
}`,
      { nums: [1, 2, 3, 4] },
      'productExceptSelf'
    )

    const response = structuredClone({
      type: 'success' as const,
      requestId: 'request-1',
      state,
    })

    expect(
      response.state.steps.filter((step) => !isExecutionStep(step))
    ).toEqual([])
    expect(isExecutionState(response.state)).toBe(true)
    expect(isExecutionWorkerResponse(response)).toBe(true)
  })
})
