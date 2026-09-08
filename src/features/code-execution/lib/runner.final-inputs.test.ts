import { describe, expect, it } from 'vite-plus/test'
import { executeCode, executeCodeAsync } from './runner'

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

  it('preserves an explicit undefined result from a non-void entry function', () => {
    const state = executeCode(
      `function findIndex(nums: number[], target: number): number | undefined {
  return nums.indexOf(target) === -1 ? undefined : 0
}`,
      { nums: [1, 2, 3], target: 4 },
      'findIndex'
    )

    expect(state.error).toBeUndefined()
    expect(state.completionValueKind).toBe('return')
    expect(state.returnValue).toBeUndefined()
    expect(state.steps.at(-1)?.description).toBe('Returned: undefined')
  })

  it('preserves an awaited undefined result from a non-void entry function', async () => {
    const state = await executeCodeAsync(
      `async function findIndex(
  nums: number[],
  target: number
): Promise<number | undefined> {
  return nums.indexOf(target) === -1 ? undefined : 0
}`,
      { nums: [1, 2, 3], target: 4 },
      'findIndex'
    )

    expect(state.error).toBeUndefined()
    expect(state.completionValueKind).toBe('return')
    expect(state.returnValue).toBeUndefined()
    expect(state.steps.at(-1)?.description).toBe('Returned: undefined')
  })

  it('uses final inputs for an asynchronously completed void entry function', async () => {
    const state = await executeCodeAsync(
      `async function rotate(nums: number[]): Promise<void> {
  nums.reverse()
}`,
      { nums: [1, 2, 3] },
      'rotate'
    )

    expect(state.error).toBeUndefined()
    expect(state.completionValueKind).toBe('final-inputs')
    expect(state.returnValue).toEqual({ nums: [3, 2, 1] })
  })
})
