import { describe, expect, it } from 'vite-plus/test'

import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import { isMap } from '@/shared/lib/guards'
import { getRegexMatchVisualizationState } from '@/features/visualization/lib/regex-match-view'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'

import { executeCode } from './runner'

const regexMatchExample = ALGORITHM_EXAMPLES.find(
  (example) => example.id === 'regular-expression-matching'
)

if (!regexMatchExample) {
  throw new Error('Regular Expression Matching example is missing')
}

describe('Regular Expression Matching visualization integration', () => {
  it('detects recursive dp coordinates and records explored memo states', () => {
    const state = executeCode(
      regexMatchExample.sourceCode,
      { s: 'aab', p: 'c*a*b' },
      'isMatch'
    )
    const completedState = { ...state, currentStep: state.steps.length - 1 }
    const detection = detectVisualizationState(completedState)
    const view = getRegexMatchVisualizationState(completedState)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)
    expect(
      state.steps.some(
        (step) =>
          step.metadata?.callFrame?.functionName === 'dp' &&
          isMap(step.variables.memo)
      )
    ).toBe(true)
    expect(detection.primaryRegexMatchStepIndex).toBeDefined()
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'regex-match',
      targetStepIndex: detection.primaryRegexMatchStepIndex,
    })
    expect(view).toMatchObject({
      source: 'aab',
      pattern: 'c*a*b',
    })
    expect(view?.visited.has('0,0')).toBe(true)

    const initialView = getRegexMatchVisualizationState(
      { ...state, currentStep: 0 },
      detection.primaryRegexMatchStepIndex
    )
    expect(initialView).not.toBeNull()
  })

  it('does not classify ordinary two-string loops as regex matching', () => {
    const state = executeCode(
      `function compare(s: string, p: string): boolean {
  for (let i = 0; i < s.length; i++) {
    for (let j = 0; j < p.length; j++) {
      if (s[i] === p[j]) return true
    }
  }
  return false
}`,
      { s: 'abc', p: 'xyz' },
      'compare'
    )

    expect(detectVisualizationState(state).primaryRegexMatchStepIndex).toBeUndefined()
  })
})
