import { describe, expect, it } from 'vite-plus/test'
import {
  getExpressionVisualizationState,
  getExpressionStepIndex,
} from '@/features/visualization/lib/expression-view'
import { isArray } from '@/shared/lib/guards'
import { executeCode } from './runner'

describe('Expression visualization integration', () => {
  it('exposes calculator state from instrumented runtime steps', () => {
    const state = executeCode(
      `
function calculate(s: string): number {
  let res = 0
  let num = 0
  const stack: number[] = [1]
  let sign = 1

  for (let i = 0; i < s.length; i++) {
    const char = s[i]

    if (char >= '0' && char <= '9') {
      num = num * 10 + (char.charCodeAt(0) - '0'.charCodeAt(0))
      continue
    }

    if (char === '+' || char === '-') {
      res += sign * num
      num = 0
      sign = stack[stack.length - 1] * (char === '+' ? 1 : -1)
      continue
    }

    if (char === '(') {
      stack.push(sign)
      sign = stack[stack.length - 1]
      continue
    }

    if (char === ')') {
      res += sign * num
      num = 0
      stack.pop()
      sign = stack[stack.length - 1]
      continue
    }
  }

  res += sign * num
  return res
}
`,
      { s: '1-(2+3)' },
      'calculate'
    )
    const openParenthesisStepIndex = state.steps.findIndex(
      (step) =>
        step.variables.i === 2 &&
        isArray(step.variables.stack) &&
        step.variables.stack.length === 2
    )
    const view = getExpressionVisualizationState({
      ...state,
      currentStep: openParenthesisStepIndex,
    })

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(-4)
    expect(getExpressionStepIndex(state)).toBeGreaterThanOrEqual(0)
    expect(openParenthesisStepIndex).toBeGreaterThanOrEqual(0)
    expect(view).toMatchObject({
      expression: '1-(2+3)',
      index: 2,
      currentChar: '(',
      signStack: [1, -1],
      action: 'Entering parentheses',
    })
  })
})
