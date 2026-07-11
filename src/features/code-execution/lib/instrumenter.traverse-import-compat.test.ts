import { describe, expect, it, vi } from 'vite-plus/test'

vi.mock('@babel/traverse', async () => {
  const actual =
    await vi.importActual<typeof import('@babel/traverse')>('@babel/traverse')

  return {
    ...actual,
    default: {
      default: actual.default,
    },
  }
})

describe('instrumenter traverse import compatibility', () => {
  it('supports nested default exports produced by browser bundlers', async () => {
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
