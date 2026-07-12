import { describe, expect, it } from 'vite-plus/test'

import type { FunctionParameter } from './types'
import {
  isParamTypeArrayLike,
  isParamTypeListNode,
  isParamTypeMatrix,
  isParamTypeNumber,
  isParamTypeTreeNode,
} from './parameter-type'

const parameter = (type: string): FunctionParameter => ({
  name: 'value',
  type,
  optional: false,
})

describe('parameter type predicates', () => {
  it('matches individual parameter types', () => {
    expect(isParamTypeNumber(parameter('number'))).toBe(true)
    expect(isParamTypeTreeNode(parameter('tree-node'))).toBe(true)
    expect(isParamTypeListNode(parameter('tree-node'))).toBe(false)
  })

  it('matches supported array and matrix groups', () => {
    expect(isParamTypeArrayLike(parameter('array'))).toBe(true)
    expect(isParamTypeArrayLike(parameter('boolean-array'))).toBe(true)
    expect(isParamTypeArrayLike(parameter('number-matrix'))).toBe(false)
    expect(isParamTypeMatrix(parameter('string-matrix'))).toBe(true)
    expect(isParamTypeMatrix(parameter('string-array'))).toBe(false)
  })
})
