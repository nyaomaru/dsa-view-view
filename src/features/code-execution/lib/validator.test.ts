import { describe, expect, it } from 'vite-plus/test'

import type { FunctionParameter } from '@/entities/code'

import { validateInputs } from './validator'

describe('input validation', () => {
  it('accepts empty array and nullable tree inputs for edge-case examples', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'words', type: 'string-array', optional: false },
      { name: 'flags', type: 'boolean-array', optional: false },
      { name: 'root', type: 'tree-node', optional: false },
    ]

    expect(
      validateInputs(parameters, {
        nums: '',
        words: '',
        flags: '',
        root: '',
      })
    ).toEqual({ success: true })
  })

  it('rejects empty tokens inside typed arrays', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'flags', type: 'boolean-array', optional: false },
    ]

    const result = validateInputs(parameters, {
      nums: '1,,2',
      flags: 'true,,false',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toEqual({
      nums: 'Must be comma-separated numbers (e.g., 1, 2, 3)',
      flags: 'Must be comma-separated booleans (e.g., true, false, true)',
    })
  })

  it('accepts JSON-style typed arrays', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'flags', type: 'boolean-array', optional: false },
    ]

    expect(
      validateInputs(parameters, {
        nums: '[2,5]',
        flags: '[true,false]',
      })
    ).toEqual({ success: true })
  })

  it('accepts variable-length rows and requires typed JSON arrays', () => {
    const parameters: FunctionParameter[] = [
      { name: 'grid', type: 'number-matrix', optional: false },
      { name: 'labels', type: 'string-matrix', optional: false },
      { name: 'seen', type: 'boolean-matrix', optional: false },
    ]

    expect(
      validateInputs(parameters, {
        grid: '[[1,2],[3]]',
        labels: '[["a","b"],["c"]]',
        seen: '[[true],[false,true]]',
      })
    ).toEqual({ success: true })

    const result = validateInputs(parameters, {
      grid: '[[1,2],["3"]]',
      labels: '[["a"],[1]]',
      seen: '[[true],[0]]',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toEqual({
      grid: 'Must be a JSON 2D array of numbers (e.g., [[1,2],[3,4]])',
      labels:
        'Must be a JSON 2D array of strings (e.g., [["a","b"],["c","d"]])',
      seen: 'Must be a JSON 2D array of booleans (e.g., [[true,false],[false,true]])',
    })
  })

  it('accepts accounts merge string matrices', () => {
    const parameters: FunctionParameter[] = [
      { name: 'accounts', type: 'string-matrix', optional: false },
    ]
    const accounts =
      '[["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co","Kevin0@m.co"],["Ethan","Ethan5@m.co","Ethan4@m.co","Ethan0@m.co"],["Hanzo","Hanzo3@m.co","Hanzo1@m.co","Hanzo0@m.co"],["Fern","Fern5@m.co","Fern1@m.co","Fern0@m.co"]]'

    expect(validateInputs(parameters, { accounts })).toEqual({
      success: true,
    })
  })

  it('validates arrays of nullable linked-list inputs', () => {
    const parameters: FunctionParameter[] = [
      { name: 'lists', type: 'list-node-array', optional: false },
    ]

    expect(
      validateInputs(parameters, {
        lists: '[[1,4,5],null,[],[1,3,4],[2,6]]',
      })
    ).toEqual({ success: true })

    expect(
      validateInputs(parameters, { lists: '[[1,4],"not-a-list"]' })
    ).toEqual({
      success: false,
      errors: {
        lists:
          'Must be a JSON array of linked lists (e.g., [[1,4,5],[1,3,4],[2,6]])',
      },
    })
  })
})
