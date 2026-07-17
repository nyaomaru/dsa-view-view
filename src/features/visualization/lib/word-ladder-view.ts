import type { ExecutionState } from '@/entities/execution'
import {
  define,
  hasKeys,
  isArray,
  isNull,
  isNumber,
  isSet,
  isString,
  isStringArray,
  isUndefined,
} from '@/shared/lib/guards'

export type WordLadderNodeState = 'unvisited' | 'visited' | 'queued' | 'current'

export type WordLadderNode = {
  word: string
  level: number | null
  state: WordLadderNodeState
  isTarget: boolean
}

export type WordLadderEdge = {
  from: string
  to: string
  isActive: boolean
}

export type WordLadderVisualizationState = {
  beginWord: string
  endWord: string
  isTargetAvailable: boolean
  nodes: WordLadderNode[]
  edges: WordLadderEdge[]
  queue: Array<{ word: string; distance: number }>
  currentWord: string | null
  currentDistance: number | null
  activePattern: string | null
}

type WordLadderInput = {
  beginWord: string
  endWord: string
  wordList: readonly string[]
}

const hasWordLadderInputKeys = hasKeys('beginWord', 'endWord', 'wordList')
const isQueueEntry = define<readonly [string, number]>((value) => {
  return (
    isArray(value) &&
    value.length === 2 &&
    isString(value[0]) &&
    isNumber(value[1])
  )
})

function getWordLadderInput(
  variables: Record<string, unknown>
): WordLadderInput | null {
  if (!hasWordLadderInputKeys(variables)) return null
  if (
    !isString(variables.beginWord) ||
    !isString(variables.endWord) ||
    !isStringArray(variables.wordList)
  ) {
    return null
  }

  const wordLength = variables.beginWord.length
  if (
    wordLength === 0 ||
    variables.endWord.length !== wordLength ||
    !variables.wordList.every((word) => word.length === wordLength)
  ) {
    return null
  }

  return {
    beginWord: variables.beginWord,
    endWord: variables.endWord,
    wordList: variables.wordList,
  }
}

/** Finds the first step containing Word Ladder inputs. */
export function getWordLadderStepIndex(
  executionState: ExecutionState
): number | undefined {
  const stepIndex = executionState.steps.findIndex((step) =>
    Boolean(getWordLadderInput(step.variables))
  )

  return stepIndex >= 0 ? stepIndex : undefined
}

function getWildcardPatterns(word: string): string[] {
  return Array.from(
    { length: word.length },
    (_, index) => `${word.slice(0, index)}*${word.slice(index + 1)}`
  )
}

function matchesWildcardPattern(word: string, pattern: string): boolean {
  if (word.length !== pattern.length) return false

  for (let index = 0; index < word.length; index += 1) {
    if (pattern[index] !== '*' && pattern[index] !== word[index]) return false
  }

  return true
}

function buildWordGraph(words: string[]): {
  adjacency: Map<string, Set<string>>
  edges: Array<{ from: string; to: string }>
} {
  const adjacency = new Map(words.map((word) => [word, new Set<string>()]))
  const patternWords = new Map<string, string[]>()

  words.forEach((word) => {
    getWildcardPatterns(word).forEach((pattern) => {
      const matches = patternWords.get(pattern) ?? []
      matches.push(word)
      patternWords.set(pattern, matches)
    })
  })

  patternWords.forEach((matches) => {
    for (let left = 0; left < matches.length; left += 1) {
      for (let right = left + 1; right < matches.length; right += 1) {
        const from = matches[left]
        const to = matches[right]
        if (isUndefined(from) || isUndefined(to)) continue
        adjacency.get(from)?.add(to)
        adjacency.get(to)?.add(from)
      }
    }
  })

  const edges = words.flatMap((from) =>
    [...(adjacency.get(from) ?? [])]
      .filter((to) => from.localeCompare(to) < 0)
      .map((to) => ({ from, to }))
  )

  return { adjacency, edges }
}

function getWordLevels(
  beginWord: string,
  adjacency: Map<string, Set<string>>
): Map<string, number> {
  const levels = new Map([[beginWord, 0]])
  const queue = [beginWord]

  while (queue.length > 0) {
    const word = queue.shift()
    if (isUndefined(word)) continue
    const level = levels.get(word)
    if (isUndefined(level)) continue

    adjacency.get(word)?.forEach((neighbor) => {
      if (levels.has(neighbor)) return
      levels.set(neighbor, level + 1)
      queue.push(neighbor)
    })
  }

  return levels
}

function getQueue(value: unknown): Array<{ word: string; distance: number }> {
  if (!isArray(value)) return []

  return value.flatMap((entry) =>
    isQueueEntry(entry) ? [{ word: entry[0], distance: entry[1] }] : []
  )
}

function getSeenWords(value: unknown): Set<string> {
  if (!isSet(value)) return new Set()
  return new Set([...value].filter(isString))
}

/** Derives the static word graph and current BFS frontier from an execution. */
export function getWordLadderVisualizationState(
  executionState: ExecutionState,
  fallbackStepIndex?: number
): WordLadderVisualizationState | null {
  const sourceStepIndex =
    getWordLadderStepIndex(executionState) ?? fallbackStepIndex
  if (isUndefined(sourceStepIndex)) return null

  const sourceStep = executionState.steps[sourceStepIndex]
  if (isUndefined(sourceStep)) return null
  const input = getWordLadderInput(sourceStep.variables)
  if (!input) return null

  const currentVariables =
    executionState.steps[executionState.currentStep]?.variables ??
    sourceStep.variables
  const words = [...new Set([input.beginWord, ...input.wordList])]
  const { adjacency, edges } = buildWordGraph(words)
  const levels = getWordLevels(input.beginWord, adjacency)
  const queue = getQueue(
    isArray(currentVariables.q) ? currentVariables.q : currentVariables.queue
  )
  const queuedWords = new Set(queue.map(({ word }) => word))
  const seenWords = getSeenWords(
    isSet(currentVariables.seen)
      ? currentVariables.seen
      : currentVariables.visited
  )
  let currentWord: string | null = null
  let currentDistance: number | null = null
  if (isString(currentVariables.w) && isNumber(currentVariables.dist)) {
    currentWord = currentVariables.w
    currentDistance = currentVariables.dist
  }
  const activePattern =
    currentWord && isString(currentVariables.pat) ? currentVariables.pat : null

  return {
    beginWord: input.beginWord,
    endWord: input.endWord,
    isTargetAvailable: input.wordList.includes(input.endWord),
    nodes: words.map((word) => ({
      word,
      level: levels.get(word) ?? null,
      state:
        word === currentWord
          ? 'current'
          : queuedWords.has(word)
            ? 'queued'
            : seenWords.has(word)
              ? 'visited'
              : 'unvisited',
      isTarget: word === input.endWord,
    })),
    edges: edges.map((edge) => {
      const otherWord =
        edge.from === currentWord
          ? edge.to
          : edge.to === currentWord
            ? edge.from
            : null

      return {
        ...edge,
        isActive:
          !isNull(otherWord) &&
          !isNull(activePattern) &&
          matchesWildcardPattern(otherWord, activePattern),
      }
    }),
    queue,
    currentWord,
    currentDistance,
    activePattern,
  }
}
