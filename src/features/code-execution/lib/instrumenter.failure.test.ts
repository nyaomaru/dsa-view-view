import { describe, expect, it, vi } from 'vite-plus/test'

vi.mock('@babel/parser', async () => {
  const actual =
    await vi.importActual<typeof import('@babel/parser')>('@babel/parser')

  return {
    ...actual,
    parse: () => {
      throw new Error('parser boom')
    },
  }
})

import { instrumentCode } from './instrumenter'

describe('instrumenter failures', () => {
  it('surfaces parser errors instead of silently executing raw code', () => {
    expect(() =>
      instrumentCode('function singleNumber() { return 4 }')
    ).toThrow('Failed to instrument code: parser boom')
  })
})
