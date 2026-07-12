import { describe, it, expect } from 'vite-plus/test'
import { executeCode } from './runner'

describe('runner - selection sort execution', () => {
  it('should execute selection sort without error', () => {
    const code = `
      function selectionSort(nums) {
        const length = nums.length;

        for (let index = 0; index < length; index++) {
          let minIndex = index;

          for (let i = index + 1; i < length; i++) {
            if (nums[i] < nums[minIndex]) {
              minIndex = i;
            }
          }

          if (minIndex !== index) {
            const temp = nums[index];
            nums[index] = nums[minIndex];
            nums[minIndex] = temp
          }
        }

        return nums;
      }
    `
    const state = executeCode(code, { nums: [5, 3, 1, 4, 2] }, 'selectionSort')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([1, 2, 3, 4, 5])
  })
})
