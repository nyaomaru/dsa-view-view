import { describe, expect, it } from 'vite-plus/test'
import { executeCode } from './runner'

describe('runner - final input values', () => {
  it('uses mutated inputs as the completion value when an entry function returns void', () => {
    const state = executeCode(
      `function rotate(nums: number[]): void {
  nums.reverse()
}`,
      { nums: [1, 2, 3] },
      'rotate'
    )

    expect(state.error).toBeUndefined()
    expect(state.completionValueKind).toBe('final-inputs')
    expect(state.returnValue).toEqual({ nums: [3, 2, 1] })
    expect(state.steps.at(-1)?.description).toBe(
      'Final value: {"nums":[3,2,1]}'
    )
  })
})
