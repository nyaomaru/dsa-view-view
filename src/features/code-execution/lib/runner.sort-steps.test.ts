import { describe, it, expect } from 'vite-plus/test'
import { executeCode } from './runner'

describe('runner - sort execution steps', () => {
  it('should count steps for array sort', () => {
    const code = `
      function sort(nums) {
        return nums.sort((a, b) => b - a)
      }
    `
    // Input: [1, 2, 3] usually takes a few comparisons
    const state = executeCode(code, { nums: [1, 2, 3] })

    // Expectation: User says 10. Let's see.
    expect(state.steps.length).toBeGreaterThan(0)
    expect(state.steps.length).toBeLessThan(6) // Expecting ~4 steps
  })

  it('should optimize steps for regular function expression in sort', () => {
    const code = `
      function sort(nums) {
        return nums.sort(function(a, b) { return b - a })
      }
    `
    const state = executeCode(code, { nums: [1, 2, 3] })
    expect(state.steps.length).toBeLessThan(8)
  })
})
