import { describe, expect, it } from 'vite-plus/test'

import { createClassDesignInput } from './class-design-input'
import { executeCode } from './runner'

const kthLargestCode = `
class MinHeap {
  private heap: number[]

  constructor() {
    this.heap = []
  }

  private leftChild(index: number): number {
    return index * 2 + 1
  }

  private rightChild(index: number): number {
    return index * 2 + 2
  }

  push(val: number) {
    this.heap.push(val)
    this.bubbleUp()
  }

  pop(): number | undefined {
    if (this.heap.length === 0) return undefined

    const top = this.heap[0]
    const end = this.heap.pop()

    if (this.heap.length > 0) {
      this.heap[0] = end ?? 0
      this.bubbleDown()
    }
    return top
  }

  peak(): number | undefined {
    return this.heap[0]
  }

  size(): number {
    return this.heap.length
  }

  private bubbleUp(): void {
    let i = this.heap.length - 1

    while (i > 0) {
      const mid = Math.floor((i - 1) / 2)
      if (this.heap[mid] < this.heap[i]) break
      ;[this.heap[mid], this.heap[i]] = [this.heap[i], this.heap[mid]]
      i = mid
    }
  }

  private bubbleDown(): void {
    let i = 0
    const length = this.size()
    while (true) {
      let smallest = i
      const left = this.leftChild(i)
      const right = this.rightChild(i)
      if (left < length && this.heap[left] < this.heap[smallest])
        smallest = left
      if (right < length && this.heap[right] < this.heap[smallest])
        smallest = right

      if (smallest === i) break
      ;[this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]]
      i = smallest
    }
  }
}

class KthLargest {
  private key: number
  private minHeap: MinHeap

  constructor(k: number, nums: number[]) {
    this.key = k
    this.minHeap = new MinHeap()

    for (const num of nums) {
      this.add(num)
    }
  }

  add(val: number): number {
    this.minHeap.push(val)
    if (this.minHeap.size() > this.key) {
      this.minHeap.pop()!
    }
    return this.minHeap.peak()!
  }
}
`

function getHeapSnapshotsForCall(
  state: ReturnType<typeof executeCode>,
  functionName: string
): number[][] {
  return state.steps.flatMap((step) => {
    if (!step.callStack?.includes(functionName)) return []

    const heap = step.metadata?.heapTrace?.heaps.find(
      (candidate) => candidate.name === 'minHeap'
    )
    return heap ? [heap.values] : []
  })
}

describe('runner - single heap trace', () => {
  it('captures bubble-up and bubble-down reordering inside a local MinHeap', () => {
    const inputs = createClassDesignInput(
      'KthLargest',
      ['KthLargest'],
      [[3, [4, 5, 8, 2]]]
    )

    const state = executeCode(kthLargestCode, inputs, 'KthLargest')
    const bubbleUpSnapshots = getHeapSnapshotsForCall(state, 'bubbleUp')
    const bubbleDownSnapshots = getHeapSnapshotsForCall(state, 'bubbleDown')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([null])
    expect(bubbleUpSnapshots).toContainEqual([4, 2, 8, 5])
    expect(bubbleUpSnapshots).toContainEqual([2, 4, 8, 5])
    expect(bubbleDownSnapshots).toContainEqual([4, 5, 8])
    expect(
      state.steps
        .flatMap((step) => step.metadata?.heapTrace?.heaps ?? [])
        .every((heap) => heap.kind === 'min')
    ).toBe(true)
  })
})
