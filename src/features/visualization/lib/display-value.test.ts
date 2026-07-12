import { describe, expect, it } from 'vite-plus/test'

import { formatDisplayValue } from './display-value'

describe('formatDisplayValue', () => {
  it('formats primitive and structured values for UI labels', () => {
    expect(formatDisplayValue('text')).toBe('text')
    expect(formatDisplayValue('text', { quoteStrings: true })).toBe('"text"')
    expect(formatDisplayValue({ value: 1 })).toBe('{"value":1}')
    expect(formatDisplayValue(null, { nullLabel: 'null' })).toBe('null')
    expect(formatDisplayValue(undefined, { undefinedLabel: 'undefined' })).toBe(
      'undefined'
    )
    expect(formatDisplayValue(Infinity)).toBe('∞')
    expect(formatDisplayValue(-Infinity)).toBe('-∞')
  })

  it('formats circular structures without throwing', () => {
    const value: Record<string, unknown> = { key: 1 }
    value.prev = value

    expect(formatDisplayValue(value)).toBe('{"key":1,"prev":"[Circular]"}')
  })
})
