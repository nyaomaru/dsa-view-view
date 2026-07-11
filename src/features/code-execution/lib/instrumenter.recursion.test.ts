import { describe, it, expect } from 'vite-plus/test'
import { instrumentCode } from './instrumenter'

describe('instrumenter - recursion', () => {
  it('should instrument nested functions', () => {
    const code = `
function permute(nums) {
  const result = [];
  function dfs() {
     result.push(1);
     return;
  }
  dfs();
  return result;
}
`
    const instrumented = instrumentCode(code)

    // Verify result.push was instrumented
    expect(instrumented).toMatch(/recordStep.*"array-mutation".*result\.push/)

    // Verify variable scope tracking: 'path' should be visible inside dfs
    // Look for recordStep calls inside dfs (e.g. line 6 'return') and check if 'path' is in variables object
    // recordStep("return", 6, "return", { result: result, path: path, ... })

    // We can't match exact object structure easily with regex, but we can look for "result", "path" in the context
    // of a recordStep inside the function.
  })

  it('should instrument Array.push/pop', () => {
    const code = `
function test() {
  const result = [];
  const path = [];
  path.push(1);
  path.pop();
}
`
    const instrumented = instrumentCode(code)

    // Expect recordStep for push
    expect(instrumented).toContain('path.push(1)')
    expect(instrumented).toMatch(
      /recordStep.*"array-mutation".*path\.push\(1\)/
    )

    // Expect recordStep for pop
    expect(instrumented).toMatch(/recordStep.*"array-mutation".*path\.pop\(\)/)
  })
})
