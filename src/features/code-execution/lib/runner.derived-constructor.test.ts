import { describe, expect, it } from 'vite-plus/test'
import { executeCode } from './runner'

describe('derived constructor instrumentation', () => {
  it('does not read this before super initializes the receiver', () => {
    const code = `
class Base {
  protected value: number

  constructor(value: number) {
    this.value = value
  }
}

class Child extends Base {
  private increment: number

  constructor(value: number) {
    const increment = 1
    super(value)
    this.increment = increment
  }

  total(): number {
    return this.value + this.increment
  }
}

function createTotal(value: number): number {
  return new Child(value).total()
}
`
    const state = executeCode(code, { value: 4 }, 'createTotal')
    const derivedConstructorSteps = state.steps.filter(
      (step) =>
        step.description === 'Entering method: constructor' ||
        step.description === 'const increment = 1'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(5)
    expect(derivedConstructorSteps).not.toHaveLength(0)
  })
})
