import { describe, expect, it } from 'vite-plus/test'
import { executeCode } from './runner'

describe('runner - return value labels', () => {
  it('does not expose synthetic return temporaries for recursive returns', () => {
    const code = `
function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}
`

    const state = executeCode(code, { n: 3 }, 'fibonacci')
    const returnSteps = state.steps.filter((step) => step.type === 'return')

    expect(state.error).toBeUndefined()
    expect(returnSteps.length).toBeGreaterThan(0)
    expect(
      returnSteps.some((step) =>
        step.description.includes('return from fibonacci line')
      )
    ).toBe(true)
    expect(returnSteps.some((step) => 'return value' in step.variables)).toBe(
      true
    )
    expect(
      returnSteps.some((step) => 'return location' in step.variables)
    ).toBe(true)

    const variableNames = state.steps.flatMap((step) =>
      Object.keys(step.variables)
    )
    expect(variableNames.some((name) => /^_ret\d*$/.test(name))).toBe(false)
    expect(
      variableNames.some((name) =>
        name.includes('algorithmVisualizerReturnValue')
      )
    ).toBe(false)
  })
})
