import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from './runner'

describe('runner - runtime comparisons', () => {
  it('evaluates operands once and preserves logical short-circuiting', () => {
    const state = executeCode(
      `
function compare(): { calls: number; first: boolean; second: boolean } {
  let calls = 0
  const next = () => calls++
  const first = next() < next()
  const second = true || next() > 0

  return { calls, first, second }
}
`,
      {},
      'compare'
    )
    const comparisons = state.steps.filter((step) => step.metadata?.comparison)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({ calls: 2, first: true, second: true })
    expect(comparisons).toHaveLength(1)
    expect(comparisons[0]?.metadata).toMatchObject({
      conditionResult: true,
      comparison: {
        left: { expression: 'next()', value: 0 },
        operator: '<',
        right: { expression: 'next()', value: 1 },
        result: true,
      },
    })
  })
})
