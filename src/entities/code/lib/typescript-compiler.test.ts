import { describe, expect, it } from 'vite-plus/test'

import { compileTypeScriptCode, lintTypeScriptCode } from '@/entities/code/lib'

describe('compileTypeScriptCode', () => {
  it('compiles TypeScript annotations away', () => {
    const result = compileTypeScriptCode(`
function add(a: number, b: number): number {
  return a + b
}
`)

    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.code).toContain('function add(a, b)')
    expect(result.code).not.toContain(': number')
  })

  it('returns an error for empty code', () => {
    const result = compileTypeScriptCode('   ')

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([
      {
        line: 1,
        column: 1,
        message: 'Code cannot be empty',
        severity: 'error',
      },
    ])
  })

  it('maps syntax errors back to editor line numbers after prepared classes are injected', () => {
    const result = compileTypeScriptCode(`
function makeNode(): ListNode {
  return new ListNode(
}
`)

    expect(result.success).toBe(false)
    expect(result.errors[0]?.line).toBe(3)
    expect(result.errors[0]?.severity).toBe('error')
  })

  it('injects prepared classes before compiling LeetCode-style code', () => {
    const result = compileTypeScriptCode(`
function makeNode(): ListNode {
  return new ListNode(1)
}
`)

    expect(result.success).toBe(true)
    expect(result.code).toContain('class ListNode')
  })
})

describe('lintTypeScriptCode', () => {
  it('reports var and console.log warnings with source locations', () => {
    const warnings = lintTypeScriptCode(`
function debug() {
  var value = 1
  console.log(value)
}
`)

    expect(warnings).toEqual([
      {
        line: 3,
        column: 3,
        message: 'Prefer const or let over var',
        severity: 'warning',
      },
      {
        line: 4,
        column: 3,
        message: 'Remove console.log before production',
        severity: 'warning',
      },
    ])
  })
})
