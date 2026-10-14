import { describe, expect, it } from 'vite-plus/test'
import {
  getJumpGameTraceCandidate,
  getJumpGameVisualizationState,
} from '@/features/visualization/lib/jump-game-view'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { executeCode } from './runner'

const source = `function jump(nums: number[]): number {
  let jumps = 0
  let currentEnd = 0
  let farthest = 0

  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i])

    if (i === currentEnd) {
      jumps++
      currentEnd = farthest
    }
  }

  return jumps
}`

describe('Jump Game II visualization integration', () => {
  it('visualizes each greedy range expansion', () => {
    const state = executeCode(source, { nums: [2, 3, 1, 1, 4] }, 'jump')
    const currentStep = state.steps.findIndex(
      (step) =>
        step.variables.i === 2 &&
        step.variables.jumps === 2 &&
        step.variables.currentEnd === 4 &&
        step.variables.farthest === 4
    )
    const candidate = getJumpGameTraceCandidate(state)
    const view = getJumpGameVisualizationState({
      executionState: { ...state, currentStep },
      variableName: 'nums',
    })
    const detection = detectVisualizationState(state)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)
    expect(currentStep).toBeGreaterThanOrEqual(0)
    expect(candidate).toMatchObject({
      name: 'nums',
      indexName: 'i',
      jumpsName: 'jumps',
      currentEndName: 'currentEnd',
      farthestName: 'farthest',
    })
    expect(view).toMatchObject({
      data: [2, 3, 1, 1, 4],
      currentIndex: 2,
      jumps: 2,
      currentEnd: 4,
      farthest: 4,
    })
    expect(detection).toMatchObject({
      primaryJumpGameArrayName: 'nums',
      primaryJumpGameStepIndex: candidate?.stepIndex,
    })
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'jump-game',
      targetVariable: 'nums',
      targetStepIndex: candidate?.stepIndex,
    })
  })

  it('does not classify unrelated running maximum code as Jump Game II', () => {
    const state = executeCode(
      `function summarize(nums: number[]): number {
  let jumps = 0
  let currentEnd = 0
  let farthest = 0

  for (let i = 0; i < nums.length; i++) {
    farthest = Math.max(farthest, nums[i])
    jumps += farthest
    currentEnd = i
  }

  return jumps
}`,
      { nums: [2, 3, 1] },
      'summarize'
    )

    expect(getJumpGameTraceCandidate(state)).toBeUndefined()
    expect(detectVisualizationState(state).primaryJumpGameArrayName).toBeUndefined()
  })
})
