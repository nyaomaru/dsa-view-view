import { isString } from '@/shared/lib/guards'
import type { AlgorithmExampleOption } from './types'

type SearchableExample = {
  /** Source example option. */
  example: AlgorithmExampleOption
  /** Normalized search tokens for matching. */
  tokens: string[]
  /** Initial letters for token-initial matching. */
  tokenInitials: string
  /** First characters present in the search tokens. */
  firstChars: Set<string>
}

export type ExampleSearchIndex = {
  /** Searchable examples in display order. */
  entries: SearchableExample[]
  /** Searchable examples grouped by first token character. */
  byFirstChar: Map<string, SearchableExample[]>
}

const DEFAULT_EXAMPLE_CATEGORY = 'Other'
const NO_FUZZY_MATCH_INDEX = -1
const EMPTY_QUERY_SCORE = 1
const ADJACENT_FUZZY_MATCH_SCORE = 3
const SPARSE_FUZZY_MATCH_SCORE = 1
const EXACT_TOKEN_MATCH_SCORE = 1_000
const TOKEN_INITIAL_MATCH_SCORE = 900
const TOKEN_PREFIX_MATCH_SCORE = 850
const TOKEN_SUBSTRING_MATCH_SCORE = 800
const FUZZY_TOKEN_MATCH_BASE_SCORE = 100
const NO_SEARCH_MATCH_SCORE = 0

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getSearchTokens(example: AlgorithmExampleOption): string[] {
  return [example.label, example.category, example.id]
    .filter(isString)
    .flatMap((value) => normalizeSearchText(value).split(' '))
    .filter(Boolean)
}

export function createExampleSearchIndex(
  examples: AlgorithmExampleOption[]
): ExampleSearchIndex {
  const entries = examples.map((example) => {
    const tokens = getSearchTokens(example)
    return {
      example,
      tokens,
      tokenInitials: tokens.map((token) => token[0]).join(''),
      firstChars: new Set(tokens.map((token) => token[0])),
    }
  })
  const byFirstChar = new Map<string, SearchableExample[]>()

  entries.forEach((entry) => {
    entry.firstChars.forEach((firstChar) => {
      byFirstChar.set(firstChar, [...(byFirstChar.get(firstChar) ?? []), entry])
    })
  })

  return { entries, byFirstChar }
}

function getFuzzySubsequenceScore(text: string, query: string): number {
  let queryIndex = 0
  let score = NO_SEARCH_MATCH_SCORE
  let previousMatchIndex = NO_FUZZY_MATCH_INDEX

  for (let textIndex = 0; textIndex < text.length; textIndex++) {
    if (text[textIndex] !== query[queryIndex]) continue

    score +=
      previousMatchIndex === textIndex - 1
        ? ADJACENT_FUZZY_MATCH_SCORE
        : SPARSE_FUZZY_MATCH_SCORE
    previousMatchIndex = textIndex
    queryIndex++

    if (queryIndex === query.length) return score
  }

  return NO_SEARCH_MATCH_SCORE
}

function getExampleSearchScore(
  entry: SearchableExample,
  query: string
): number {
  if (!query) return EMPTY_QUERY_SCORE
  if (entry.tokenInitials.startsWith(query)) {
    return TOKEN_INITIAL_MATCH_SCORE - query.length
  }

  const terms = query.split(' ').filter(Boolean)
  let totalScore = NO_SEARCH_MATCH_SCORE

  for (const term of terms) {
    const termScore = Math.max(
      ...entry.tokens.map((token) => {
        if (token === term) return EXACT_TOKEN_MATCH_SCORE - term.length
        if (token.startsWith(term)) {
          return TOKEN_PREFIX_MATCH_SCORE - term.length
        }
        if (token.includes(term)) {
          return TOKEN_SUBSTRING_MATCH_SCORE - term.length
        }

        const fuzzyScore = getFuzzySubsequenceScore(token, term)
        return fuzzyScore > NO_SEARCH_MATCH_SCORE
          ? FUZZY_TOKEN_MATCH_BASE_SCORE + fuzzyScore
          : NO_SEARCH_MATCH_SCORE
      })
    )

    if (termScore <= NO_SEARCH_MATCH_SCORE) return NO_SEARCH_MATCH_SCORE
    totalScore += termScore
  }

  return totalScore
}

export function searchExamples(
  index: ExampleSearchIndex,
  search: string
): AlgorithmExampleOption[] {
  const query = normalizeSearchText(search)
  if (!query) return index.entries.map((entry) => entry.example)

  const firstChar = query[0]
  const candidates = index.byFirstChar.get(firstChar) ?? index.entries
  const rankedExamples = candidates
    .map((entry, order) => ({
      example: entry.example,
      order,
      score: getExampleSearchScore(entry, query),
    }))
    .filter((result) => result.score > NO_SEARCH_MATCH_SCORE)
    .sort((left, right) => right.score - left.score || left.order - right.order)

  return rankedExamples.map((result) => result.example)
}

export function groupExamplesByCategory(examples: AlgorithmExampleOption[]) {
  const groups = new Map<string, AlgorithmExampleOption[]>()

  examples.forEach((example) => {
    const category = example.category ?? DEFAULT_EXAMPLE_CATEGORY
    groups.set(category, [...(groups.get(category) ?? []), example])
  })

  return [...groups.entries()]
}
