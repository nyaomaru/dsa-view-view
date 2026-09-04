import { describe, expect, it } from 'vite-plus/test'

import {
  ALGORITHM_EXAMPLES,
  getNumberOfIslandsDfsComparison,
} from '@/entities/algorithm-example'

describe('algorithm examples', () => {
  it('keeps example ids unique', () => {
    const ids = ALGORITHM_EXAMPLES.map((example) => example.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('provides source code and category metadata for every example', () => {
    for (const example of ALGORITHM_EXAMPLES) {
      expect(example.label, example.id).toBeTruthy()
      expect(example.category, example.id).toBeTruthy()
      expect(example.sourceCode.trim(), example.id).toBeTruthy()
    }
  })

  it('ships 42 examples', () => {
    expect(ALGORITHM_EXAMPLES).toHaveLength(42)
  })

  it('pairs both Number of Islands DFS implementations', () => {
    const recursive = getNumberOfIslandsDfsComparison('number-of-islands')
    const iterative = getNumberOfIslandsDfsComparison('number-of-islands-stack')

    expect(recursive?.selectedImplementation).toBe('recursive')
    expect(iterative?.selectedImplementation).toBe('iterative')
    expect(recursive?.recursive).toBe(iterative?.recursive)
    expect(recursive?.iterative).toBe(iterative?.iterative)
  })
})
