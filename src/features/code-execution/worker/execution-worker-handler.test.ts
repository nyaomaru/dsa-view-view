import { describe, expect, it } from 'vite-plus/test'
import { handleExecutionWorkerRequest } from './execution-worker-handler'

describe('handleExecutionWorkerRequest', () => {
  it('waits for an async entry point before returning its execution state', async () => {
    const response = await handleExecutionWorkerRequest({
      type: 'execute',
      requestId: 'async-request',
      code: `async function answer(): Promise<number> {
  const value = await Promise.resolve(42)
  return value
}`,
      inputs: {},
      entryFunctionName: 'answer',
      language: 'typescript',
    })

    expect(response.type).toBe('success')
    if (response.type !== 'success') return

    expect(response.state.error).toBeUndefined()
    expect(response.state.returnValue).toBe(42)
    expect(response.state.steps.some((step) => step.line === 3)).toBe(true)
    expect(response.state.steps.map((step) => step.type)).toEqual(
      expect.arrayContaining(['await-suspend', 'await-resume'])
    )
  })

  it('returns the recorded trace when an awaited Promise rejects', async () => {
    const response = await handleExecutionWorkerRequest({
      type: 'execute',
      requestId: 'rejected-request',
      code: `async function fail(): Promise<void> {
  const before = 'recorded'
  await Promise.reject(new Error('boom'))
}`,
      inputs: {},
      entryFunctionName: 'fail',
      language: 'typescript',
    })

    expect(response.type).toBe('success')
    if (response.type !== 'success') return

    expect(response.state.error).toBe('boom')
    expect(
      response.state.steps.find((step) => step.type === 'await-reject')
        ?.variables.before
    ).toBe('recorded')
  })
})
