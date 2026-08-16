import { describe, expect, it } from 'vite-plus/test'

import {
  getGraphNodeAdjacencyRecord,
  isAdjacencyListCandidate,
} from './graph-view'

describe('isAdjacencyListCandidate', () => {
  it('accepts graph adjacency lists and rejects binary matrices', () => {
    expect(isAdjacencyListCandidate('graph', [[1], [0, 2], [1]])).toBe(true)
    expect(
      isAdjacencyListCandidate('graph', [
        [0, 1],
        [1, 0],
      ])
    ).toBe(false)
  })
})

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
