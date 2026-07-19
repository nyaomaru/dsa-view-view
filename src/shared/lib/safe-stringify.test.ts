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

  it('preserves non-JSON values recursively', () => {
    expect(safeStringify([Infinity, NaN, null, -Infinity, -0])).toBe(
      '[Infinity,NaN,null,-Infinity,-0]'
    )
    expect(safeStringify({ count: 1n, missing: undefined })).toBe(
      '{"count":1n,"missing":undefined}'
    )
  })

  it('does not confuse marker-like strings with non-JSON values', () => {
    expect(safeStringify(['\u0000dsa-view-view-non-json:0', Infinity])).toBe(
      '["\\u0000dsa-view-view-non-json:0",Infinity]'
    )
  })
})
