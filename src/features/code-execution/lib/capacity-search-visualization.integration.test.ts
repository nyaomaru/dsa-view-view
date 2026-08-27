import { describe, expect, it } from 'vite-plus/test'
import {
  getCapacitySearchTraceCandidate,
  getCapacitySearchVisualizationState,
} from '@/features/visualization/lib/capacity-search-view'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { executeCode } from './runner'

const shipWithinDaysCode = `
function shipWithinDays(weights: number[], days: number): number {
  let left = Math.max(...weights)
  let right = weights.reduce((a, b) => a + b, 0)

  const canShip = (capacity: number): boolean => {
    let requiredDays = 1
    let current = 0

    for (const weight of weights) {
      if (current + weight > capacity) {
        requiredDays++
        current = weight
        if (requiredDays > days) return false
      } else {
        current += weight
      }
    }
    return true
  }

  while (left < right) {
    const mid = Math.floor((left + right) / 2)

    if (canShip(mid)) {
      right = mid
    } else {
      left = mid + 1
    }
  }

  return left
}
`

describe('Capacity-search visualization integration', () => {
  it('treats the bounds as capacities and advances package indexes', () => {
    const state = executeCode(
      shipWithinDaysCode,
      { weights: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], days: 5 },
      'shipWithinDays'
    )
    const candidate = getCapacitySearchTraceCandidate(state)
    const firstLoopStepIndex = state.steps.findIndex(
      (step) => step.description === 'for (... of weights)'
    )
    const firstFrameId =
      state.steps[firstLoopStepIndex].metadata?.callFrame?.frameId
    const firstPassIndexes = state.steps.flatMap((step, stepIndex) =>
      step.description === 'for (... of weights)' &&
      step.metadata?.callFrame?.frameId === firstFrameId
        ? [stepIndex]
        : []
    )
    const view = getCapacitySearchVisualizationState({
      executionState: { ...state, currentStep: firstPassIndexes[4] },
      variableName: 'weights',
    })
    const detection = detectVisualizationState(state)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(15)
    expect(firstPassIndexes).toHaveLength(10)
    expect(candidate).toEqual({
      name: 'weights',
      stepIndex: firstLoopStepIndex,
    })
    expect(view).toMatchObject({
      left: 10,
      right: 55,
      mid: 32,
      capacity: 32,
      totalWeight: 55,
      targetDays: 5,
      currentIndex: 4,
      currentLoad: 15,
      requiredDays: 1,
      canShip: true,
    })
    expect(detection).toMatchObject({
      primaryCapacitySearchArrayName: 'weights',
      primaryCapacitySearchStepIndex: firstLoopStepIndex,
      primaryBinarySearchArrayName: undefined,
    })
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'capacity-search',
      targetVariable: 'weights',
      targetStepIndex: firstLoopStepIndex,
    })

    const finalView = getCapacitySearchVisualizationState({
      executionState: {
        ...state,
        currentStep: state.steps.length - 1,
      },
      variableName: 'weights',
    })

    expect(finalView).toMatchObject({
      left: 15,
      right: 15,
      mid: 14,
      capacity: 15,
      isConverged: true,
      requiredDays: 5,
      canShip: true,
    })
    expect(
      finalView?.packages
        .filter((packageState) => packageState.day === 1)
        .map((packageState) => packageState.weight)
    ).toEqual([1, 2, 3, 4, 5])
  })

  it('tracks duplicate weights by call-frame iteration order', () => {
    const state = executeCode(
      shipWithinDaysCode,
      { weights: [3, 3, 3, 3], days: 2 },
      'shipWithinDays'
    )
    const loopStepIndexes = state.steps.flatMap((step, stepIndex) =>
      step.description === 'for (... of weights)' ? [stepIndex] : []
    )
    const firstFrameId =
      state.steps[loopStepIndexes[0]].metadata?.callFrame?.frameId
    const firstPassIndexes = loopStepIndexes.filter(
      (stepIndex) =>
        state.steps[stepIndex].metadata?.callFrame?.frameId === firstFrameId
    )
    const indexes = firstPassIndexes.map(
      (currentStep) =>
        getCapacitySearchVisualizationState({
          executionState: { ...state, currentStep },
          variableName: 'weights',
        })?.currentIndex
    )

    expect(state.returnValue).toBe(6)
    expect(indexes).toEqual([0, 1, 2, 3])
  })
})
