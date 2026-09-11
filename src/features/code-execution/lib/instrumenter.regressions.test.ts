import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from './runner'

describe('instrumentation regressions', () => {
  it('keeps the call-frame identifier available in function error handlers', () => {
    const code = `
      function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
        if (nums1.length > nums2.length) {
          return findMedianSortedArrays(nums2, nums1)
        }

        const m = nums1.length
        const n = nums2.length

        let low = 0
        let high = m

        while (low <= high) {
          const partitionA = Math.floor((low + high) / 2)
          const partitionB = Math.floor((m + n + 1) / 2) - partitionA

          const maxLeftA = partitionA === 0 ? -Infinity : nums1[partitionA - 1]
          const minRightA = partitionA === m ? Infinity : nums1[partitionA]
          const maxLeftB = partitionB === 0 ? -Infinity : nums2[partitionB - 1]
          const minRightB = partitionB === n ? Infinity : nums2[partitionB]

          if (maxLeftA <= minRightB && maxLeftB <= minRightA) {
            if ((m + n) % 2 === 0) {
              return (
                (Math.max(maxLeftA, maxLeftB) + Math.min(minRightA, minRightB)) / 2
              )
            }
          }

          if (maxLeftA > minRightB) {
            high = partitionA - 1
          } else {
            low = partitionA + 1
          }
        }

        throw new Error('Invalid input')
      }
      `
    const state = executeCode(
      code,
      { nums1: [1, 3], nums2: [2] },
      'findMedianSortedArrays'
    )

    expect(state.error).toBe('Invalid input')
  })

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

  it('does not treat awaits in assigned functions as part of the assignment', () => {
    const state = executeCode(
      `
      function configure() {
        let callback
        callback = async () => await Promise.resolve(42)
        return typeof callback
      }
      `,
      {},
      'configure'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('function')
    expect(
      state.steps.some(
        (step) =>
          step.type === 'assignment' &&
          step.description.startsWith('callback =')
      )
    ).toBe(true)
  })

  it('does not treat awaits in array mutation callbacks as part of the mutation', () => {
    const state = executeCode(
      `
      function configure() {
        const callbacks = []
        const length = callbacks.push(
          async () => await Promise.resolve(42)
        )
        return length
      }
      `,
      {},
      'configure'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(1)
    expect(
      state.steps.some(
        (step) =>
          step.type === 'array-mutation' &&
          step.description.startsWith('callbacks.push(')
      )
    ).toBe(true)
  })

  it('restores the caller frame after a caught synchronous throw', () => {
    const state = executeCode(
      `
      function fail(): never {
        throw new Error('boom')
      }

      function recover(): boolean {
        let recovered = false
        try {
          fail()
        } catch {
          recovered = true
        }
        return recovered
      }
      `,
      {},
      'recover'
    )
    const recoverEntry = state.steps.find(
      (step) =>
        step.metadata?.callFrame?.phase === 'enter' &&
        step.metadata.callFrame.functionName === 'recover'
    )
    const failThrow = state.steps.find(
      (step) =>
        step.metadata?.callFrame?.phase === 'throw' &&
        step.metadata.callFrame.functionName === 'fail'
    )
    const recoveredAssignment = state.steps.find(
      (step) =>
        step.type === 'assignment' && step.description.startsWith('recovered =')
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)
    expect(failThrow?.type).toBe('function-throw')
    expect(recoveredAssignment?.metadata?.callFrame?.frameId).toBe(
      recoverEntry?.metadata?.callFrame?.frameId
    )
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
