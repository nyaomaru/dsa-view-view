import { describe, expect, it } from 'vite-plus/test'

import { extractFunctionSignature } from '@/features/code-editing/lib/parser'
import { createClassDesignInput } from './class-design-input'
import { executeCode } from './runner'

const myQueueCode = `
class MyQueue {
  private stackIn: number[]
  private stackOut: number[]

  constructor() {
    this.stackIn = []
    this.stackOut = []
  }

  push(x: number) {
    this.stackIn.push(x)
  }

  pop(): number {
    this.moveIfNeeded()
    return this.stackOut.pop()!
  }

  peek(): number {
    this.moveIfNeeded()
    return this.stackOut[this.stackOut.length - 1]
  }

  empty(): boolean {
    return this.stackIn.length === 0 && this.stackOut.length === 0
  }

  private moveIfNeeded() {
    if (this.stackOut.length === 0) {
      while (this.stackIn.length > 0) {
        this.stackOut.push(this.stackIn.pop()!)
      }
    }
  }
}
`

describe('class design inputs', () => {
  it('extracts class signatures for LeetCode design-style verification', () => {
    const signature = extractFunctionSignature(myQueueCode)

    expect(signature).toMatchObject({
      kind: 'class',
      name: 'MyQueue',
      parameters: [],
      returnType: 'MyQueue',
    })
    expect(signature?.methods?.map((method) => method.name)).toEqual([
      'push',
      'pop',
      'peek',
      'empty',
    ])
  })

  it('executes LeetCode design-style class operations', () => {
    const inputs = createClassDesignInput(
      'MyQueue',
      ['MyQueue', 'push', 'push', 'peek', 'pop', 'empty'],
      [[], [1], [2], [], [], []]
    )

    const state = executeCode(myQueueCode, inputs, 'MyQueue')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([null, null, null, 1, 1, false])
  })
})
