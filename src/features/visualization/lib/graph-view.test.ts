import { describe, expect, it } from 'vite-plus/test'

import { getGraphNodeAdjacencyRecord } from './graph-view'

describe('getGraphNodeAdjacencyRecord', () => {
  it('converts cyclic graph nodes without revisiting them', () => {
    const one = { val: 1, neighbors: [] as unknown[] }
    const two = { val: 2, neighbors: [one] }
    one.neighbors.push(two)

    expect(getGraphNodeAdjacencyRecord(one)).toEqual({
      1: [2],
      2: [1],
    })
  })
})
