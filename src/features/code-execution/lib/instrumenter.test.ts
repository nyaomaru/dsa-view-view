import { describe, it, expect } from 'vite-plus/test'
import { instrumentCode } from './instrumenter'

describe('instrumenter', () => {
  it('should preserve correct line numbers for TypeScript code', () => {
    const code = `function kthGrammar(n: number, k: number): number {
  if (n === 1) return 0;

  const parent = kthGrammar(n - 1, Math.ceil(k / 2));

  if (k % 2 === 1) return parent;

  return parent ^ 1;
}`

    const instrumented = instrumentCode(code)

    // Check for variable declaration on line 4 (0-indexed line 3?? No, Babel loc is 1-indexed)
    // The user said: "variable-declaration Line 3" (incorrect) -> "Line 4" (correct)

    // We expect recordStep to be called with literal 4 for the variable declaration
    // We can look for the string: recordStep("variable-declaration", 4,
    // Note: Babel generates strings with double quotes usually.

    expect(instrumented).toContain('recordStep("variable-declaration", 4')
  })

  it('should handle empty lines correctly', () => {
    const code = `
function test() {
  const x = 1;
  
  const y = 2;
}`
    // x is line 3
    // y is line 5

    const instrumented = instrumentCode(code)
    expect(instrumented).toContain('recordStep("variable-declaration", 3')
    expect(instrumented).toContain('recordStep("variable-declaration", 5')
  })
})
