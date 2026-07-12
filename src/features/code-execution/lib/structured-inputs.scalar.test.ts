import { describe, expect, it } from 'vite-plus/test'

import type { FunctionParameter } from '@/entities/code'

import { convertInputValues } from './structured-inputs'
import { executeCode } from './runner'

describe('scalar and array input conversion', () => {
  it('converts blank typed arrays to empty arrays', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'words', type: 'string-array', optional: false },
      { name: 'flags', type: 'boolean-array', optional: false },
    ]

    expect(
      convertInputValues(parameters, {
        nums: '',
        words: '',
        flags: '',
      })
    ).toEqual({
      nums: [],
      words: [],
      flags: [],
    })
  })

  it('trims typed array tokens before conversion', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'words', type: 'string-array', optional: false },
      { name: 'flags', type: 'boolean-array', optional: false },
    ]

    expect(
      convertInputValues(parameters, {
        nums: ' 1, 2.5, -3 ',
        words: ' alpha, beta , gamma ',
        flags: ' true, FALSE, true ',
      })
    ).toEqual({
      nums: [1, 2.5, -3],
      words: ['alpha', 'beta', 'gamma'],
      flags: [true, false, true],
    })
  })

  it('converts JSON-style typed arrays', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'words', type: 'string-array', optional: false },
      { name: 'flags', type: 'boolean-array', optional: false },
    ]

    expect(
      convertInputValues(parameters, {
        nums: '[2,5]',
        words: '["left","right"]',
        flags: '[true,false]',
      })
    ).toEqual({
      nums: [2, 5],
      words: ['left', 'right'],
      flags: [true, false],
    })
  })

  it('converts generic JSON arrays and falls back to CSV tokens', () => {
    const parameters: FunctionParameter[] = [
      { name: 'jsonValues', type: 'array', optional: false },
      { name: 'csvValues', type: 'array', optional: false },
    ]

    expect(
      convertInputValues(parameters, {
        jsonValues: '[1,"two"]',
        csvValues: 'left, right',
      })
    ).toEqual({
      jsonValues: [1, 'two'],
      csvValues: ['left', 'right'],
    })
  })

  it('converts clone graph adjacency lists to graph nodes', () => {
    const parameters: FunctionParameter[] = [
      { name: 'node', type: 'graph-node', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      node: '[[2,4],[1,3],[2,4],[1,3]]',
    }) as {
      node: { val: number; neighbors: { val: number }[] } | null
    }

    expect(inputs.node?.val).toBe(1)
    expect(inputs.node?.neighbors.map((neighbor) => neighbor.val)).toEqual([
      2, 4,
    ])
  })

  it.each([null, undefined, '', ' NULL ', 'invalid JSON'])(
    'converts empty graph input %j to null',
    (value) => {
      const parameters: FunctionParameter[] = [
        { name: 'node', type: 'graph-node', optional: false },
      ]

      expect(convertInputValues(parameters, { node: value })).toEqual({
        node: null,
      })
    }
  )

  it('executes cloneGraph with converted graph-node input', () => {
    const code = `
function cloneGraph(node: _Node | null): _Node | null {
  if (!node) return null

  const visited = new Map<_Node, _Node>()

  function dfs(node: _Node): _Node {
    if (visited.has(node)) {
      return visited.get(node)!
    }

    const clone = new _Node(node.val)
    visited.set(node, clone)

    for (const neighbor of node.neighbors) {
      clone.neighbors.push(dfs(neighbor))
    }

    return clone
  }

  return dfs(node)
}
`
    const parameters: FunctionParameter[] = [
      { name: 'node', type: 'graph-node', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      node: '[[2,4],[1,3],[2,4],[1,3]]',
    })
    const state = executeCode(code, inputs, 'cloneGraph')

    expect(state.error).toBeUndefined()
    expect((state.returnValue as { val?: number } | undefined)?.val).toBe(1)
    expect(
      (
        state.returnValue as { neighbors?: { val: number }[] } | undefined
      )?.neighbors?.map((neighbor) => neighbor.val)
    ).toEqual([2, 4])
  })
})
