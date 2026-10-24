import { describe, expect, it } from 'vite-plus/test'
import {
  getPermutationStepIndex,
  getPermutationVisualizationState,
} from '@/features/visualization/lib/permutation-view'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { isNumericArray } from '@/shared/lib/guards'
import { executeCode } from './runner'

const source = `function getPermutation(n: number, k: number): string {
  const numbers: number[] = []
  const factorial: number[] = [1]

  for (let i = 1; i <= n; i++) {
    numbers.push(i)
    factorial[i] = factorial[i - 1] * i
  }

  k--

  let result = ''

  for (let remain = n; remain >= 1; remain--) {
    const blockSize = factorial[remain - 1]
    const index = Math.floor(k / blockSize)
    result += numbers[index]
    numbers.splice(index, 1)
    k %= blockSize
  }

  return result
}`

describe('k-th permutation visualization integration', () => {
  it('detects and follows factoradic selections', () => {
    const state = executeCode(source, { n: 4, k: 9 }, 'getPermutation')
    const initialSelectionStep = state.steps.findIndex(
      (step) =>
        step.variables.remain === 4 &&
        step.variables.blockSize === 6 &&
        step.variables.index === 1 &&
        step.variables.k === 8
    )
    const steppedState = { ...state, currentStep: initialSelectionStep }
    const candidateStepIndex = getPermutationStepIndex(state)
    const visualization = getPermutationVisualizationState(steppedState)
    const detection = detectVisualizationState(state)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('2314')
    expect(initialSelectionStep).toBeGreaterThanOrEqual(0)
    expect(candidateStepIndex).toBe(initialSelectionStep)
    expect(visualization).toMatchObject({
      numbers: [1, 2, 3, 4],
      factorial: [1, 1, 2, 6, 24],
      remain: 4,
      blockSize: 6,
      index: 1,
      rank: 8,
      result: '',
      selectionIsCommitted: false,
    })
    expect(detection.primaryPermutationStepIndex).toBe(candidateStepIndex)
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'permutation',
      targetStepIndex: candidateStepIndex,
    })

    const postSpliceStep = state.steps.findIndex(
      (step) =>
        step.variables.remain === 4 &&
        isNumericArray(step.variables.numbers) &&
        step.variables.numbers.length === 3
    )
    const postSpliceVisualization = getPermutationVisualizationState({
      ...state,
      currentStep: postSpliceStep,
    })

    expect(postSpliceStep).toBeGreaterThanOrEqual(0)
    expect(postSpliceVisualization).toMatchObject({
      numbers: [1, 2, 3, 4],
      result: '2',
      selectionIsCommitted: true,
    })
  })

  it('does not classify unrelated factorial calculations as a permutation trace', () => {
    const state = executeCode(
      `function factorial(n: number): number {
  const values = [1]
  for (let i = 1; i <= n; i++) values[i] = values[i - 1] * i
  return values[n]
}`,
      { n: 4 },
      'factorial'
    )

    expect(getPermutationStepIndex(state)).toBeUndefined()
    expect(detectVisualizationState(state).primaryPermutationStepIndex).toBeUndefined()
  })
})
