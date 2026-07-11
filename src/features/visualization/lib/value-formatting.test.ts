import { describe, expect, it } from 'vite-plus/test'

import { isInlineReturnValue, stringifyValue } from './value-formatting'

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
})
