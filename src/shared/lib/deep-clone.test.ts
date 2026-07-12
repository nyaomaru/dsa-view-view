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

  it('preserves Map, Set, and RegExp values in the fallback clone', () => {
    const fn = () => null
    const value = {
      fn,
      map: new Map([[1, { count: 2 }]]),
      set: new Set(['a', 'b']),
      pattern: /dp/gi,
    }

    const clone = deepClone(value)

    expect(clone.map).not.toBe(value.map)
    expect(clone.map.get(1)).toEqual({ count: 2 })
    expect(clone.map.get(1)).not.toBe(value.map.get(1))
    expect(clone.set).not.toBe(value.set)
    expect([...clone.set]).toEqual(['a', 'b'])
    expect(clone.pattern).not.toBe(value.pattern)
    expect(clone.pattern.source).toBe('dp')
    expect(clone.pattern.flags).toBe('gi')
  })

  it('preserves cycles and shared references in the fallback clone', () => {
    const shared = { value: 1 }
    const items: unknown[] = [shared, shared]
    items.push(items)
    const value = { fn: () => null, items }

    const clone = deepClone(value)

    expect(clone.items).not.toBe(items)
    expect(clone.items[0]).toBe(clone.items[1])
    expect(clone.items[2]).toBe(clone.items)
  })
})
