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
