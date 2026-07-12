import { describe, expect, it, vi } from 'vite-plus/test'

vi.mock('@babel/generator', async () => {
  const actual =
    await vi.importActual<typeof import('@babel/generator')>('@babel/generator')

  return {
    ...actual,
    default: {
      default: actual.default,
      generate: actual.generate,
    },
  }
})

describe('instrumenter generator import compatibility', () => {
  it('supports nested generator exports produced by browser bundlers', async () => {
    const { instrumentCode } = await import('./instrumenter')

    const instrumented = instrumentCode(`
function singleNumber(nums: number[]): number {
  let result = 0

  for (const num of nums) {
    result ^= num
  }

  return result
}
`)

    expect(instrumented).toContain('recordStep("assignment", 6')
  })
})
