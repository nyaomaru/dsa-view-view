import { describe, it, expect } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'
import { executeCode } from './runner'

const validParenthesesCode = `
function isValid(s: string): boolean {
  const pairs = new Map<string, string>([
    [')', '('],
    [']', '['],
    ['}', '{'],
  ])
  const stack: string[] = []

  for (const char of s) {
    if (char === '(' || char === '[' || char === '{') {
      stack.push(char)
      continue
    }

    if (stack.pop() !== pairs.get(char)) return false
  }

  return stack.length === 0
}
`

function getStackPopComparisonStep(state: ExecutionState) {
  return state.steps.find(
    (step) =>
      step.metadata?.comparison?.left.expression === 'stack.pop()' &&
      step.metadata.comparison.operator === '!=='
  )
}

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

  it.each([
    {
      input: '([)]',
      actual: '[',
      remainingStack: ['('],
    },
    {
      input: ')',
      actual: undefined,
      remainingStack: [],
    },
  ])(
    'captures inline stack.pop() operands for invalid input $input',
    ({ input, actual, remainingStack }) => {
      const state = executeCode(validParenthesesCode, { s: input }, 'isValid')
      const comparisonStep = getStackPopComparisonStep(state)

      expect(state.error).toBeUndefined()
      expect(state.returnValue).toBe(false)
      expect(comparisonStep?.metadata?.comparison).toEqual({
        left: { expression: 'stack.pop()', value: actual },
        operator: '!==',
        right: { expression: 'pairs.get(char)', value: '(' },
        result: true,
      })
      expect(comparisonStep?.variables.stack).toEqual(remainingStack)
    }
  )

  it('keeps successful Valid Parentheses execution unchanged', () => {
    const state = executeCode(validParenthesesCode, { s: '([])' }, 'isValid')
    const comparisons = state.steps.filter(
      (step) => step.metadata?.comparison?.left.expression === 'stack.pop()'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)
    expect(comparisons).toHaveLength(2)
    expect(
      comparisons.every((step) => step.metadata?.comparison?.result === false)
    ).toBe(true)
  })
})
