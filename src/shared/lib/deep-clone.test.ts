import { describe, expect, it } from 'vite-plus/test'

import { deepClone } from './deep-clone'

describe('deepClone', () => {
  it('preserves infinity values when structuredClone cannot clone the object', () => {
    const fn = () => null
    const value = {
      fn,
      matrix: [
        [Infinity, -Infinity],
        [0, 1],
      ],
    }

    const clone = deepClone(value)

    expect(clone).not.toBe(value)
    expect(clone.fn).toBe(fn)
    expect(clone.matrix).not.toBe(value.matrix)
    expect(clone.matrix[0][0]).toBe(Infinity)
    expect(clone.matrix[0][1]).toBe(-Infinity)
  })
})
