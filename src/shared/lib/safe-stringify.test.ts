import { describe, expect, it } from 'vite-plus/test'

import { safeStringify } from './safe-stringify'

describe('safeStringify', () => {
  it('keeps Map and Set contents visible', () => {
    expect(safeStringify(new Map([[2, 0]]))).toBe(
      '{"type":"Map","entries":[[2,0]]}'
    )
    expect(safeStringify(new Set(['a', 'b']))).toBe(
      '{"type":"Set","values":["a","b"]}'
    )
  })
})
