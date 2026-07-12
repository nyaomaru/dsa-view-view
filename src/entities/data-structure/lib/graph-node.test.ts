import { describe, expect, it } from 'vite-plus/test'

import { isGraphNodeShape } from './graph-node'

describe('isGraphNodeShape', () => {
  it('accepts cyclic graph nodes', () => {
    const one = { val: 1, neighbors: [] as unknown[] }
    const two = { val: 2, neighbors: [one] }
    one.neighbors.push(two)

    expect(isGraphNodeShape(one)).toBe(true)
  })
})
