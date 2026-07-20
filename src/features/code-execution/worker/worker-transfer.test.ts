import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from '../lib/runner'
import { createWorkerTransferValue } from './worker-transfer'

describe('createWorkerTransferValue', () => {
  it('preserves invalid Date instances', () => {
    const invalidDate = new Date('invalid')

    const transferred = createWorkerTransferValue({ invalidDate })
    const clonedByBrowser = structuredClone(transferred)

    expect(transferred.invalidDate).toBeInstanceOf(Date)
    expect(Number.isNaN(transferred.invalidDate.getTime())).toBe(true)
    expect(clonedByBrowser.invalidDate).toBeInstanceOf(Date)
    expect(Number.isNaN(clonedByBrowser.invalidDate.getTime())).toBe(true)
  })

  it.each(['Map', 'Set', 'RegExp'])(
    'does not treat a spoofed %s tag as a built-in instance',
    (tag) => {
      const taggedObject = {
        [Symbol.toStringTag]: tag,
        callback() {},
      }

      expect(createWorkerTransferValue(taggedObject)).toEqual({
        callback: '[Function callback]',
      })
    }
  )

  it('preserves cyclic graphs while replacing local functions', () => {
    const first: {
      val: number
      neighbors: Array<{ val: number; neighbors: unknown[] }>
    } = { val: 1, neighbors: [] }
    const second = { val: 2, neighbors: [first] }
    first.neighbors.push(second)
    const clone = () => first
    const value = {
      variables: {
        clone,
        clones: new Map([[first, first]]),
        node: first,
      },
      returnValue: first,
    }

    const transferred = createWorkerTransferValue(value)
    const clonedByBrowser = structuredClone(transferred)

    expect(transferred.variables.clone).toBe('[Function clone]')
    expect(transferred.returnValue).toBe(transferred.variables.node)
    expect(clonedByBrowser.returnValue.neighbors[0].neighbors[0]).toBe(
      clonedByBrowser.returnValue
    )
    expect(clonedByBrowser.variables.clones).toBeInstanceOf(Map)
  })

  it('makes cloneGraph execution state transferable', () => {
    const first: { val: number; neighbors: unknown[] } = {
      val: 1,
      neighbors: [],
    }
    const second = { val: 2, neighbors: [first] }
    first.neighbors.push(second)
    const state = executeCode(
      `function cloneGraph(node: _Node | null): _Node | null {
  if (node === null) return null
  const clones = new Map<_Node, _Node>()
  const clone = (current: _Node): _Node => {
    if (clones.has(current)) return clones.get(current)!
    const copied = new _Node(current.val)
    clones.set(current, copied)
    for (const neighbor of current.neighbors) {
      copied.neighbors.push(clone(neighbor))
    }
    return copied
  }
  return clone(node)
}`,
      { node: first },
      'cloneGraph'
    )
    const response = createWorkerTransferValue({
      type: 'success' as const,
      requestId: 'clone-graph',
      state,
    })

    const received = structuredClone(response)
    const returned = received.state.returnValue as {
      val: number
      neighbors: Array<{ val: number; neighbors: unknown[] }>
    }

    expect(returned.val).toBe(1)
    expect(returned.neighbors[0].val).toBe(2)
    expect(returned.neighbors[0].neighbors[0]).toBe(returned)
  })
})
