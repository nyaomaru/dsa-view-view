import { describe, it, expect } from 'vite-plus/test'
import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import {
  RETURN_VALUE_LABEL,
  STEP_TYPES,
  type ExecutionState,
} from '@/entities/execution'
import { executeCode } from './runner'

const validParenthesesCode = ALGORITHM_EXAMPLES.find(
  (example) => example.id === 'valid-parentheses'
)?.sourceCode

if (!validParenthesesCode) {
  throw new Error('Valid Parentheses example is missing')
}

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

  it('captures inline stack.pop() operands for mismatched pairs', () => {
    const state = executeCode(validParenthesesCode, { s: '([)]' }, 'isValid')
    const comparisonStep = getStackPopComparisonStep(state)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(false)
    expect(comparisonStep?.metadata?.comparison).toEqual({
      left: { expression: 'stack.pop()', value: '[' },
      operator: '!==',
      right: { expression: 'pairs.get(char)', value: '(' },
      result: true,
    })
    expect(comparisonStep?.variables.stack).toEqual(['('])
  })

  it('records empty-stack rejection before attempting to pop', () => {
    const state = executeCode(validParenthesesCode, { s: ')(' }, 'isValid')
    const comparisonIndex = state.steps.findIndex(
      (step) =>
        step.metadata?.comparison?.left.expression === 'stack.length' &&
        step.metadata.comparison.operator === '===' &&
        step.metadata.comparison.right.expression === '0'
    )
    const returnIndex = state.steps.findIndex(
      (step, index) =>
        index > comparisonIndex &&
        step.type === STEP_TYPES.RETURN &&
        step.variables[RETURN_VALUE_LABEL] === false
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(false)
    expect(comparisonIndex).toBeGreaterThan(-1)
    expect(state.steps[comparisonIndex]?.metadata?.comparison).toEqual({
      left: { expression: 'stack.length', value: 0 },
      operator: '===',
      right: { expression: '0', value: 0 },
      result: true,
    })
    expect(returnIndex).toBeGreaterThan(comparisonIndex)
    expect(getStackPopComparisonStep(state)).toBeUndefined()
  })

  it('rejects unbalanced opening brackets', () => {
    const state = executeCode(validParenthesesCode, { s: '((' }, 'isValid')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(false)
  })

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
