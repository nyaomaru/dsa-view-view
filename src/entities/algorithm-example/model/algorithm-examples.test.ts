import { describe, expect, it } from 'vite-plus/test'

import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'

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

  it('ships 39 examples', () => {
    expect(ALGORITHM_EXAMPLES).toHaveLength(39)
  })
})
