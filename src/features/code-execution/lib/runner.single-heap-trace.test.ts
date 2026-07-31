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

const kSmallestPairsCode = `
type HeapItem = {
  sum: number
  i: number
  j: number
}

class MinHeapPairs {
  private heap: HeapItem[] = []

  get size(): number {
    return this.heap.length
  }

  push(item: HeapItem): void {
    this.heap.push(item)
    this.bubbleUp(this.heap.length - 1)
  }

  pop(): HeapItem | undefined {
    if (this.heap.length === 0) return undefined

    const min = this.heap[0]
    const last = this.heap.pop()!

    if (this.heap.length > 0) {
      this.heap[0] = last
      this.bubbleDown(0)
    }

    return min
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.heap[parent].sum <= this.heap[index].sum) break

      ;[this.heap[parent], this.heap[index]] = [
        this.heap[index],
        this.heap[parent],
      ]
      index = parent
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length

    while (true) {
      let smallest = index
      const left = index * 2 + 1
      const right = index * 2 + 2

      if (left < length && this.heap[left].sum < this.heap[smallest].sum)
        smallest = left
      if (right < length && this.heap[right].sum < this.heap[smallest].sum)
        smallest = right
      if (smallest === index) break

      ;[this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ]
      index = smallest
    }
  }
}

function kSmallestPairs(
  nums1: number[],
  nums2: number[],
  k: number
): number[][] {
  const result: number[][] = []
  const minHeap = new MinHeapPairs()

  for (let i = 0; i < Math.min(nums1.length, k); i++) {
    minHeap.push({ sum: nums1[i] + nums2[0], i, j: 0 })
  }

  while (result.length < k && minHeap.size > 0) {
    const current = minHeap.pop()!
    result.push([nums1[current.i], nums2[current.j]])

    if (current.j + 1 < nums2.length) {
      minHeap.push({
        sum: nums1[current.i] + nums2[current.j + 1],
        i: current.i,
        j: current.j + 1,
      })
    }
  }

  return result
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

  it('captures summed object values from a MinHeap-prefixed class', () => {
    const state = executeCode(
      kSmallestPairsCode,
      { nums1: [1, 7, 11], nums2: [2, 4, 6], k: 3 },
      'kSmallestPairs'
    )
    const heaps = state.steps.flatMap(
      (step) => step.metadata?.heapTrace?.heaps ?? []
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([
      [1, 2],
      [1, 4],
      [1, 6],
    ])
    expect(heaps.length).toBeGreaterThan(0)
    expect(heaps.every((heap) => heap.kind === 'min')).toBe(true)
    expect(heaps).toContainEqual({
      name: 'minHeap',
      kind: 'min',
      values: [3, 9, 13],
    })
  })
})
