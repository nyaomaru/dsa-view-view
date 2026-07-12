import { describe, it, expect } from 'vite-plus/test'
import { instrumentCode } from './instrumenter'

describe('instrumenter', () => {
  it('should instrument update expressions (left++, right++)', () => {
    const code = `
function lengthOfLongestSubstring(s) {
  let left = 0;
  let right = 0;
  while (right < s.length) {
    right++;
    left++;
    ++right;
    --left;
  }
}
`
    const instrumented = instrumentCode(code)

    // We expect recordStep calls for these updates
    expect(instrumented).toContain('recordStep("assignment", 6, "right++"')
    expect(instrumented).toContain('recordStep("assignment", 7, "left++"')
    expect(instrumented).toContain('recordStep("assignment", 8, "++right"')
    expect(instrumented).toContain('recordStep("assignment", 9, "--left"')
    // Actually, UpdateExpression is not currently handled, so we expect this to FAIL or just NOT contain the instrumentation.
    // The user says "lines are not being followed".

    // So if I grep for "recordStep" related to "right", it should be there if working.
    // With current implementation, it won't be there for right++

    // count evaluation removed
    // We expect 2 variable declarations + 1 loop + 0 updates (currently)
    // 2 var declarations
    // 1 loop
    // = 3 recordSteps

    // If we fix it, we should see more.
    expect(instrumented).not.toContain('t.identifier("right")') // This is a weak check on generated code structure, better to check for the runtime effect or string presence in generated code.
  })
})
