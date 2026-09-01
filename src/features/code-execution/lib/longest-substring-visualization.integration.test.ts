import { describe, expect, it } from 'vite-plus/test'

import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import { getSlidingWindowVisualizationState } from '@/features/visualization/lib/sliding-window-view'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'

import { executeCode } from './runner'

const longestSubstringExample = ALGORITHM_EXAMPLES.find(
  (example) =>
    example.id === 'longest-substring-without-repeating-characters'
)

if (!longestSubstringExample) {
  throw new Error('Longest Substring example is missing')
}

describe('Longest Substring visualization integration', () => {
  it('tracks the half-open window, unique characters, and best length', () => {
    const state = executeCode(
      longestSubstringExample.sourceCode,
      { s: 'abcabcbb' },
      'lengthOfLongestSubstring'
    )
    const currentStep = state.steps.length - 1
    const completedState = { ...state, currentStep }
    const initialWindowStep = state.steps.findIndex(
      (step) =>
        step.variables.left === 0 &&
        step.variables.right === 0 &&
        step.variables.best === 0
    )
    const detection = detectVisualizationState(completedState)
    const view = getSlidingWindowVisualizationState({
      executionState: completedState,
      variableName: 's',
    })
    const initialView = getSlidingWindowVisualizationState({
      executionState: { ...state, currentStep: initialWindowStep },
      variableName: 's',
    })

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)
    expect(initialWindowStep).toBeGreaterThan(-1)
    expect(initialView?.windowState).toMatchObject({
      left: 0,
      right: 0,
      rangeMode: 'half-open',
      windowSize: 0,
      setValues: [],
      best: 0,
    })
    expect(view).toEqual({
      data: 'abcabcbb',
      windowState: {
        left: 7,
        right: 8,
        rangeMode: 'half-open',
        windowSize: 1,
        pattern: undefined,
        setValues: ['b'],
        best: 3,
      },
    })
    expect(detection).toMatchObject({
      primarySlidingWindowStringName: 's',
      primarySlidingWindowStepIndex: currentStep,
    })
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'sliding-window',
      targetVariable: 's',
      targetStepIndex: currentStep,
    })
  })

  it('keeps Unicode characters aligned with visualization cells', () => {
    const state = executeCode(
      longestSubstringExample.sourceCode,
      { s: '😀😀' },
      'lengthOfLongestSubstring'
    )
    const currentStep = state.steps.length - 1
    const view = getSlidingWindowVisualizationState({
      executionState: { ...state, currentStep },
      variableName: 's',
    })

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(1)
    expect(Array.from(view?.data ?? '')).toHaveLength(2)
    expect(view?.windowState).toMatchObject({
      left: 1,
      right: 2,
      rangeMode: 'half-open',
      windowSize: 1,
      setValues: ['😀'],
      best: 1,
    })
  })
})
