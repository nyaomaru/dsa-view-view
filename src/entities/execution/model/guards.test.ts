import { describe, expect, it } from 'vite-plus/test'

import { isRuntimeComparison } from './guards'

const comparison = {
  left: { expression: 'stack.pop()', value: undefined },
  operator: '!==',
  right: { expression: 'pairs[char]', value: '(' },
  result: true,
}

describe('isRuntimeComparison', () => {
  it('accepts an explicit undefined operand value', () => {
    expect(isRuntimeComparison(comparison)).toBe(true)
  })

  it('rejects a missing operand value', () => {
    expect(
      isRuntimeComparison({
        ...comparison,
        left: { expression: 'stack.pop()' },
      })
    ).toBe(false)
  })

  it('rejects invalid comparison fields', () => {
    expect(isRuntimeComparison({ ...comparison, operator: '=' })).toBe(false)
    expect(isRuntimeComparison({ ...comparison, result: 'true' })).toBe(false)
  })
})
