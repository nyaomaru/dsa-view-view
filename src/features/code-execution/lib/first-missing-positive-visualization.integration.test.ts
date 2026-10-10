import { describe, expect, it } from 'vite-plus/test'

import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'

import { executeCode } from './runner'

const firstMissingPositiveExample = ALGORITHM_EXAMPLES.find(
  (example) => example.id === 'first-missing-positive'
)

if (!firstMissingPositiveExample) {
  throw new Error('First Missing Positive example is missing')
}

describe('First Missing Positive visualization integration', () => {
  it('opens the dedicated cyclic-placement view', () => {
    const state = executeCode(
      firstMissingPositiveExample.sourceCode,
      { nums: [3, 4, -1, 1] },
      'firstMissingPositive'
    )
    const completedState = { ...state, currentStep: state.steps.length - 1 }
    const detection = detectVisualizationState(completedState)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)
    expect(detection.primaryFirstMissingPositiveArrayName).toBe('nums')
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'first-missing-positive',
      targetVariable: 'nums',
    })

  })

  it('opens the view when every value is already placed', () => {
    const state = executeCode(
      firstMissingPositiveExample.sourceCode,
      { nums: [1, 2, 0] },
      'firstMissingPositive'
    )
    const completedState = { ...state, currentStep: state.steps.length - 1 }
    const detection = detectVisualizationState(completedState)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)
    expect(detection.primaryFirstMissingPositiveArrayName).toBe('nums')
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'first-missing-positive',
      targetVariable: 'nums',
    })
  })
})
