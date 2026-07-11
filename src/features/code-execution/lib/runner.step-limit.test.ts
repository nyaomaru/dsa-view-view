import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from './runner'
import { getStepLimitMessage, MAX_STEPS } from './execution-errors'

describe('runner - step limit', () => {
  it('returns a user-facing error when execution is truncated', () => {
    const state = executeCode(
      `
function spin(): number {
  let count = 0

  while (true) {
    count += 1
  }

  return count
}
`,
      {},
      'spin'
    )

    const message = getStepLimitMessage(MAX_STEPS)

    expect(state.error).toBe(message)
    expect(state.returnValue).toBeUndefined()
    expect(state.steps.at(-1)?.description).toBe(`Warning: ${message}`)
    expect(state.totalSteps).toBe(state.steps.length)
  })
})
