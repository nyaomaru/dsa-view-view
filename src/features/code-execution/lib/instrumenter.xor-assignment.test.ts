import { describe, expect, it } from 'vite-plus/test'

import { instrumentCode } from './instrumenter'
import { executeCode } from './runner'

describe('runner - xor accumulation steps', () => {
  it('instruments compound xor assignments inside loops', () => {
    const code = `
function singleNumber(nums: number[]): number {
  let result = 0

  for (const num of nums) {
    result ^= num
  }

  return result
}
`

    const instrumented = instrumentCode(code)

    expect(instrumented).toMatch(
      /recordStep\("assignment", 6, `result \^= num -> \$\{.*\}`/
    )
  })

  it('records intermediate result updates for xor accumulation', () => {
    const code = `
function singleNumber(nums: number[]): number {
  let result = 0

  for (const num of nums) {
    result ^= num
  }

  return result
}
`

    const state = executeCode(
      code,
      { nums: [1, 2, 2, 3, 1, 4, 3] },
      'singleNumber'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(4)
    const assignmentSteps = state.steps.filter(
      (step) => step.type === 'assignment'
    )

    expect(assignmentSteps.length).toBe(7)
    expect(assignmentSteps.map((step) => step.description)).toEqual([
      'result ^= num -> 1',
      'result ^= num -> 3',
      'result ^= num -> 1',
      'result ^= num -> 2',
      'result ^= num -> 3',
      'result ^= num -> 7',
      'result ^= num -> 4',
    ])
  })
})
