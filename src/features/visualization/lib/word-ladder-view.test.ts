import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import {
  getWordLadderStepIndex,
  getWordLadderVisualizationState,
} from './word-ladder-view'

function createStep(
  stepNumber: number,
  variables: Record<string, unknown>
): ExecutionStep {
  return {
    stepNumber,
    type: 'assignment',
    line: stepNumber + 1,
    description: 'Word Ladder step',
    variables,
    timestamp: stepNumber,
  }
}

function createState(
  currentStep: number,
  steps: ExecutionStep[]
): ExecutionState {
  return {
    currentStep,
    totalSteps: steps.length,
    steps,
    isComplete: false,
  }
}

const inputs = {
  beginWord: 'hit',
  endWord: 'cog',
  wordList: ['hot', 'dot', 'dog', 'lot', 'log', 'cog'],
}

describe('Word Ladder View', () => {
  it('derives graph levels and the current BFS frontier', () => {
    const state = createState(1, [
      createStep(0, inputs),
      createStep(1, {
        ...inputs,
        q: [
          ['dot', 3],
          ['lot', 3],
        ],
        seen: new Set(['hit', 'hot', 'dot', 'lot']),
        w: 'hot',
        dist: 2,
        pat: 'h*t',
      }),
    ])
    const view = getWordLadderVisualizationState(state)

    expect(getWordLadderStepIndex(state)).toBe(0)
    expect(view?.currentWord).toBe('hot')
    expect(view?.currentDistance).toBe(2)
    expect(view?.activePattern).toBe('h*t')
    expect(view?.queue).toEqual([
      { word: 'dot', distance: 3 },
      { word: 'lot', distance: 3 },
    ])
    expect(view?.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ word: 'hit', level: 0, state: 'visited' }),
        expect.objectContaining({ word: 'hot', level: 1, state: 'current' }),
        expect.objectContaining({ word: 'dot', level: 2, state: 'queued' }),
        expect.objectContaining({ word: 'cog', level: 4, isTarget: true }),
      ])
    )
    expect(view?.edges).toContainEqual({
      from: 'hit',
      to: 'hot',
      isActive: true,
    })
  })

  it('reports when the target is absent from wordList', () => {
    const state = createState(0, [
      createStep(0, { ...inputs, wordList: inputs.wordList.slice(0, -1) }),
    ])

    expect(getWordLadderVisualizationState(state)?.isTargetAvailable).toBe(
      false
    )
  })

  it('rejects unrelated string and array inputs', () => {
    const state = createState(0, [
      createStep(0, {
        source: 'hit',
        target: 'cog',
        words: inputs.wordList,
      }),
    ])

    expect(getWordLadderStepIndex(state)).toBeUndefined()
    expect(getWordLadderVisualizationState(state)).toBeNull()
  })
})
