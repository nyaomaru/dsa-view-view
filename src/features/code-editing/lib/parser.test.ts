import { describe, expect, it } from 'vite-plus/test'
import { extractFunctionSignature } from './parser'

describe('extractFunctionSignature', () => {
  it('detects array and matrix parameter types', () => {
    const signature = extractFunctionSignature(`
function search(grid: number[][], words: string[], flags?: boolean[]): number {
  return 0
}
`)

    expect(signature).toEqual({
      name: 'search',
      parameters: [
        { name: 'grid', type: 'number-matrix', optional: false },
        { name: 'words', type: 'string-array', optional: false },
        { name: 'flags', type: 'boolean-array', optional: true },
      ],
      returnType: 'number',
    })
  })

  it('detects arrow function signatures assigned to variables', () => {
    const signature = extractFunctionSignature(`
const canVisit = (node: TreeNode | null, seen: boolean[][]): boolean => {
  return true
}
`)

    expect(signature).toEqual({
      name: 'canVisit',
      parameters: [
        { name: 'node', type: 'tree-node', optional: false },
        { name: 'seen', type: 'boolean-matrix', optional: false },
      ],
      returnType: 'boolean',
    })
  })

  it('detects TreeNode union parameters as tree-node inputs', () => {
    const signature = extractFunctionSignature(`
class TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

function lowestCommonAncestor(
  root: TreeNode | null,
  p: TreeNode | null,
  q: TreeNode | null
): TreeNode | null {
  return root
}
`)

    expect(signature).not.toBeNull()
    expect(signature?.parameters.map((param) => param.type)).toEqual([
      'tree-node',
      'tree-node',
      'tree-node',
    ])
  })

  it('detects ListNode union parameters as list-node inputs', () => {
    const signature = extractFunctionSignature(`
class ListNode {
  val: number
  next: ListNode | null
}

function mergeTwoLists(
  list1: ListNode | null,
  list2: ListNode | null
): ListNode | null {
  return list1
}
`)

    expect(signature).not.toBeNull()
    expect(signature?.parameters).toEqual([
      { name: 'list1', type: 'list-node', optional: false },
      { name: 'list2', type: 'list-node', optional: false },
    ])
    expect(signature?.returnType).toBe('list-node')
  })

  it('detects arrays of nullable ListNode values as list-node-array inputs', () => {
    const signature = extractFunctionSignature(`
function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
  return lists[0] ?? null
}
`)

    expect(signature).not.toBeNull()
    expect(signature?.parameters).toEqual([
      { name: 'lists', type: 'list-node-array', optional: false },
    ])
    expect(signature?.returnType).toBe('list-node')
  })

  it('detects non-nullable ListNode arrays as list-node-array inputs', () => {
    const signature = extractFunctionSignature(`
function firstList(lists: ListNode[]): ListNode | null {
  return lists[0] ?? null
}
`)

    expect(signature?.parameters[0]?.type).toBe('list-node-array')
  })

  it('detects generic Array and ReadonlyArray ListNode inputs', () => {
    const signature = extractFunctionSignature(`
function inspectLists(
  lists: Array<ListNode | null>,
  readonlyLists: ReadonlyArray<ListNode>
): number {
  return lists.length + readonlyLists.length
}
`)

    expect(signature?.parameters).toEqual([
      { name: 'lists', type: 'list-node-array', optional: false },
      { name: 'readonlyLists', type: 'list-node-array', optional: false },
    ])
  })

  it('detects _Node union parameters as graph-node inputs', () => {
    const signature = extractFunctionSignature(`
function cloneGraph(node: _Node | null): _Node | null {
  return node
}
`)

    expect(signature).not.toBeNull()
    expect(signature?.parameters).toEqual([
      { name: 'node', type: 'graph-node', optional: false },
    ])
    expect(signature?.returnType).toBe('graph-node')
  })

  it('detects class signatures for design problems', () => {
    const signature = extractFunctionSignature(`
class MyQueue {
  constructor() {}
  push(x: number) {}
  pop(): number { return 0 }
  private moveIfNeeded() {}
}
`)

    expect(signature).toEqual({
      kind: 'class',
      name: 'MyQueue',
      parameters: [],
      returnType: 'MyQueue',
      methods: [
        {
          name: 'push',
          parameters: [{ name: 'x', type: 'number', optional: false }],
          returnType: 'any',
        },
        {
          name: 'pop',
          parameters: [],
          returnType: 'number',
        },
      ],
    })
  })

  it('prefers the design class over an earlier data-only helper class', () => {
    const signature = extractFunctionSignature(`
class LRUNode {
  key: number
  value: number
  constructor(key: number, value: number) {
    this.key = key
    this.value = value
  }
}

class LRUCache {
  private capacity: number
  constructor(capacity: number) { this.capacity = capacity }
  private remove(node: LRUNode) {}
  get(key: number): number { return -1 }
  put(key: number, value: number): void {}
}
`)

    expect(signature).toMatchObject({
      kind: 'class',
      name: 'LRUCache',
      parameters: [{ name: 'capacity', type: 'number', optional: false }],
      methods: [{ name: 'get' }, { name: 'put' }],
    })
  })

  it('keeps the first design class ahead of later behavioral helpers', () => {
    const signature = extractFunctionSignature(`
class MedianFinder {
  addNum(num: number): void {}
  findMedian(): number { return 0 }
}

class MinHeap {
  size(): number { return 0 }
  peek(): number | undefined { return undefined }
  push(value: number): void {}
  pop(): number | undefined { return undefined }
}
`)

    expect(signature).toMatchObject({
      kind: 'class',
      name: 'MedianFinder',
      methods: [{ name: 'addNum' }, { name: 'findMedian' }],
    })
  })

  it('prefers a later design class over an earlier behavioral helper', () => {
    const signature = extractFunctionSignature(`
class DoublyLinkedList {
  add(value: number): void {}
  remove(value: number): void {}
}

class LRUCache {
  get(key: number): number { return -1 }
  put(key: number, value: number): void {}
  has(key: number): boolean { return false }
}
`)

    expect(signature).toMatchObject({
      kind: 'class',
      name: 'LRUCache',
      methods: [{ name: 'get' }, { name: 'put' }, { name: 'has' }],
    })
  })

  it('uses a lone prepared class override as the design target', () => {
    const signature = extractFunctionSignature(`
class MinHeap {
  push(value: number): void {}
  pop(): number { return 0 }
}
`)

    expect(signature).toMatchObject({
      kind: 'class',
      name: 'MinHeap',
      methods: [{ name: 'push' }, { name: 'pop' }],
    })
  })

  it('detects returned function parameters for LeetCode factory solutions', () => {
    const signature = extractFunctionSignature(`
function isBadVersion(n: number): boolean {
  return n >= 3
}

var solution = function (isBadVersion: (n: number) => boolean) {
  return function (n: number): number {
    return n
  }
}
`)

    expect(signature).toEqual({
      name: 'solution',
      parameters: [{ name: 'n', type: 'number', optional: false }],
      returnType: 'number',
    })
  })
})
