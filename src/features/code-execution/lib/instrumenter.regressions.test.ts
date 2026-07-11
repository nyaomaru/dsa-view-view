import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from './runner'

describe('instrumentation regressions', () => {
  it('does not instrument function-expression callbacks for skipped array methods', () => {
    const state = executeCode(
      `
      function sum(nums) {
        let total = 0
        nums.map(function(num) {
          total = total + num
          return num * 2
        })
        return total
      }
      `,
      { nums: [1, 2, 3] },
      'sum'
    )

    expect(state.error).toBeUndefined()
    expect(
      state.steps.some((step) =>
        step.description.includes('Entering anonymous function')
      )
    ).toBe(false)
    expect(
      state.steps.some((step) =>
        step.description.includes('total = total + num')
      )
    ).toBe(false)
    expect(state.returnValue).toBe(6)
  })

  it('does not instrument arrow callbacks for skipped array methods', () => {
    const state = executeCode(
      `
      function sum(nums) {
        let total = 0
        nums.forEach((num) => {
          total = total + num
        })
        return total
      }
      `,
      { nums: [1, 2, 3] },
      'sum'
    )

    expect(state.error).toBeUndefined()
    expect(
      state.steps.some((step) =>
        step.description.includes('Entering arrow function')
      )
    ).toBe(false)
    expect(
      state.steps.some((step) =>
        step.description.includes('total = total + num')
      )
    ).toBe(false)
    expect(state.returnValue).toBe(6)
  })

  it('preserves assignment-expression semantics for member expressions with side effects', () => {
    const state = executeCode(
      `
      function assign(arr) {
        let i = 0
        const value = (arr[i++] = 7)
        return { i, value, arr }
      }
      `,
      { arr: [0] },
      'assign'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({
      i: 1,
      value: 7,
      arr: [7],
    })
  })

  it('executes returned functions for LeetCode factory solutions', () => {
    const state = executeCode(
      `
function isBadVersion(n: number): boolean {
  if (n >= 3) return true
  return false
}

var solution = function (isBadVersion: (n: number) => boolean) {
  return function (n: number): number {
    let left = 1
    let right = n

    while (left < right) {
      const mid = Math.floor((left + right) / 2)

      if (isBadVersion(mid)) {
        right = mid
      } else {
        left = mid + 1
      }
    }

    return left
  }
}
      `,
      { n: 5 },
      'solution'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)
    expect(
      state.steps.some((step) => step.description === 'while (left < right)')
    ).toBe(true)
    expect(
      state.steps.some(
        (step) =>
          step.type === 'return' && step.description.endsWith(': function')
      )
    ).toBe(true)
    expect(
      state.steps.every((step) => !step.description.includes('let left = 1;'))
    ).toBe(true)
  })
})
