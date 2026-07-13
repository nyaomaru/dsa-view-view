import { describe, expect, it } from 'vite-plus/test'

import { getSlidingWindowState } from './sliding-window-view'

describe('getSlidingWindowState', () => {
  it('recognizes abbreviated boundaries and a t pattern', () => {
    expect(
      getSlidingWindowState('ADOBECODEBANC', {
        s: 'ADOBECODEBANC',
        t: 'ABC',
        l: 0,
        r: 5,
      })
    ).toEqual({
      left: 0,
      right: 5,
      pattern: 'ABC',
    })
  })
})
