import { describe, expect, it } from 'vite-plus/test'
import {
  createExampleSearchIndex,
  groupExamplesByCategory,
  searchExamples,
} from './example-search'
import type { AlgorithmExampleOption } from './types'

const examples: AlgorithmExampleOption[] = [
  { id: 'two-sum', label: 'Two Sum', category: 'Hash Map' },
  {
    id: 'container-with-most-water',
    label: 'Container With Most Water',
    category: 'Two Pointers',
  },
  {
    id: 'invert-binary-tree',
    label: 'Invert Binary Tree',
    category: 'Binary Tree',
  },
]

describe('example search', () => {
  it('matches token initials and fuzzy subsequences', () => {
    const index = createExampleSearchIndex(examples)

    expect(searchExamples(index, 'cwmw').map((example) => example.id)).toEqual([
      'container-with-most-water',
    ])
    expect(searchExamples(index, 'ibt').map((example) => example.id)).toEqual([
      'invert-binary-tree',
    ])
    expect(
      searchExamples(index, 'cnt water').map((example) => example.id)
    ).toEqual(['container-with-most-water'])
  })

  it('preserves source order for an empty query', () => {
    const index = createExampleSearchIndex(examples)

    expect(searchExamples(index, '')).toEqual(examples)
  })

  it('groups uncategorized examples under Other', () => {
    expect(
      groupExamplesByCategory([
        { id: 'custom-example', label: 'Custom Example' },
      ])
    ).toEqual([['Other', [{ id: 'custom-example', label: 'Custom Example' }]]])
  })
})
