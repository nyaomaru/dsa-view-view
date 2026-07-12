import { describe, expect, it } from 'vite-plus/test'

import { compileAndLint, compileCode, lintCode } from './compiler'

describe('compiler facade', () => {
  it('compiles code through the default language adapter', () => {
    const result = compileCode(`
function identity(value: number): number {
  return value
}
`)

    expect(result.success).toBe(true)
    expect(result.code).toContain('function identity(value)')
  })

  it('lints code through the default language adapter', () => {
    const warnings = lintCode('var value = 1')

    expect(warnings).toEqual([
      {
        line: 1,
        column: 1,
        message: 'Prefer const or let over var',
        severity: 'warning',
      },
    ])
  })

  it('merges compilation errors and lint warnings', () => {
    const result = compileAndLint('var value =')

    expect(result.success).toBe(false)
    expect(result.errors.some((error) => error.severity === 'error')).toBe(true)
    expect(result.errors).toContainEqual({
      line: 1,
      column: 1,
      message: 'Prefer const or let over var',
      severity: 'warning',
    })
  })
})
