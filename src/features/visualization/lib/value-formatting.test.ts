import { describe, expect, it } from 'vite-plus/test'

import {
  isInlineReturnValue,
  stringifyValue,
  stringifyValuePreview,
  VALUE_PREVIEW_LIMIT,
} from './value-formatting'

describe('value formatting', () => {
  it('formats cyclic graph-node return values as adjacency lists', () => {
    const one = { val: 1, neighbors: [] as unknown[] }
    const two = { val: 2, neighbors: [] as unknown[] }
    const three = { val: 3, neighbors: [] as unknown[] }
    const four = { val: 4, neighbors: [] as unknown[] }

    one.neighbors = [two, four]
    two.neighbors = [one, three]
    three.neighbors = [two, four]
    four.neighbors = [one, three]

    expect(stringifyValue(one)).toBe('[[2,4],[1,3],[2,4],[1,3]]')
    expect(isInlineReturnValue(one)).toBe(true)
  })

  it('limits large value previews without changing short values', () => {
    const largeValue = Array.from({ length: 100 }, (_, index) => index)
    const serializedValue = stringifyValue(largeValue)

    expect(stringifyValuePreview([Infinity, NaN])).toBe('[Infinity,NaN]')
    expect(stringifyValuePreview(largeValue)).toBe(
      `${serializedValue.slice(0, VALUE_PREVIEW_LIMIT - 1)}…`
    )
    expect(stringifyValuePreview(largeValue)).toHaveLength(VALUE_PREVIEW_LIMIT)
  })
})
