import { describe, expect, it } from 'vite-plus/test'
import { getWordLadderVisualizationState } from '@/features/visualization/lib/word-ladder-view'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { executeCode } from './runner'

describe('Word Ladder visualization integration', () => {
  it('exposes the BFS queue, distance, and visited words from runtime steps', () => {
    const code = `
function ladderLength(
  beginWord: string,
  endWord: string,
  wordList: string[]
): number {
  if (!wordList.includes(endWord)) return 0

  const L = beginWord.length
  const allWords = new Set(wordList)
  allWords.add(beginWord)
  const buckets = new Map<string, string[]>()

  for (const w of allWords) {
    for (let i = 0; i < L; i++) {
      const pat = w.slice(0, i) + '*' + w.slice(i + 1)
      if (!buckets.has(pat)) buckets.set(pat, [])
      buckets.get(pat)!.push(w)
    }
  }

  const q: [string, number][] = [[beginWord, 1]]
  const seen = new Set<string>([beginWord])

  while (q.length) {
    const [w, dist] = q.shift()!
    if (w === endWord) return dist

    for (let i = 0; i < L; i++) {
      const pat = w.slice(0, i) + '*' + w.slice(i + 1)
      const neighbors = buckets.get(pat)
      if (!neighbors) continue

      buckets.set(pat, [])
      for (const nx of neighbors) {
        if (!seen.has(nx)) {
          seen.add(nx)
          q.push([nx, dist + 1])
        }
      }
    }
  }

  return 0
}
`
    const state = executeCode(
      code,
      {
        beginWord: 'hit',
        endWord: 'cog',
        wordList: ['hot', 'dot', 'dog', 'lot', 'log', 'cog'],
      },
      'ladderLength'
    )
    const hotStepIndex = state.steps.findIndex(
      (step) =>
        step.variables.w === 'hot' &&
        step.variables.dist === 2 &&
        step.description.startsWith('q.push')
    )
    const hotState = { ...state, currentStep: hotStepIndex }
    const view = getWordLadderVisualizationState(hotState)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(5)
    expect(hotStepIndex).toBeGreaterThan(0)
    expect(detectVisualizationState(state).primaryWordLadderStepIndex).toBe(0)
    expect(view?.currentWord).toBe('hot')
    expect(view?.currentDistance).toBe(2)
    expect(view?.nodes.find((node) => node.word === 'cog')?.level).toBe(4)
    expect(view?.queue.length).toBeGreaterThan(0)
  })
})
