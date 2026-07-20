import { describe, expect, it } from 'vite-plus/test'
import { isDate, isMap, isRegExp, isSet } from './guards'

describe('built-in instance guards', () => {
  it('accepts genuine built-in instances, including invalid Dates', () => {
    expect(isDate(new Date('invalid'))).toBe(true)
    expect(isMap(new Map())).toBe(true)
    expect(isSet(new Set())).toBe(true)
    expect(isRegExp(/value/)).toBe(true)
  })

  it('rejects plain objects with spoofed built-in tags', () => {
    expect(isMap({ [Symbol.toStringTag]: 'Map' })).toBe(false)
    expect(isSet({ [Symbol.toStringTag]: 'Set' })).toBe(false)
    expect(isRegExp({ [Symbol.toStringTag]: 'RegExp' })).toBe(false)
    expect(isDate({ [Symbol.toStringTag]: 'Date', getTime: () => 0 })).toBe(
      false
    )
  })
})
