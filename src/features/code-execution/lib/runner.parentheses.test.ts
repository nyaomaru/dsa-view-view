import { describe, it, expect } from 'vite-plus/test'
import { executeCode } from './runner'

describe('runner - parentheses validation', () => {
  it('should generate steps for each iteration of for-of loop', () => {
    const code = `
function isValid(s: string): boolean {
  const stack: string[] = [];
  const pairs: Record<string, string> = {
    '}': '{',
    ')': '(',
    ']': '[',
  };

  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      const top = stack.pop();
      if (top !== pairs[char]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}
`
    const state = executeCode(code, { s: '{}{}{}()()' }, 'isValid')

    expect(state.error).toBeUndefined()
    expect(state.totalSteps).toBeGreaterThan(5) // The input is long enough to produce at least 5 steps.
  })
})
