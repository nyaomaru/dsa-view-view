import { describe, expect, it } from 'vite-plus/test'

import {
  compileTypeScriptCode,
  getPreparedTypeScriptEditorClassSource,
} from '@/entities/code/lib'
import { createClassDesignInput } from './class-design-input'
import { executeCode } from './runner'

describe('prepared classes', () => {
  it('executes ListNode logic without declaring ListNode in the editor code', () => {
    const code = `
function addOne(head: ListNode | null): ListNode | null {
  const dummy = new ListNode(0, head)
  return dummy.next
}
`
    const state = executeCode(code, { head: { val: 1, next: null } }, 'addOne')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({ val: 1, next: null })
  })

  it('executes TreeNode construction without declaring TreeNode in the editor code', () => {
    const code = `
function makeRoot(val: number): TreeNode {
  return new TreeNode(val)
}
`
    const state = executeCode(code, { val: 7 }, 'makeRoot')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({ val: 7, left: null, right: null })
  })

  it('uses the editor class when a prepared class name is declared locally', () => {
    const code = `
class ListNode {
  val: number
  next: ListNode | null
  source: string

  constructor(val?: number, next?: ListNode | null) {
    this.val = val === undefined ? -1 : val
    this.next = next === undefined ? null : next
    this.source = 'editor'
  }
}

function makeNode(): ListNode {
  return new ListNode()
}
`
    const state = executeCode(code, {}, 'makeNode')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({ val: -1, next: null, source: 'editor' })
  })

  it('strips shared prepared-class imports and injects the matching class', () => {
    const code = `
import { TreeNode } from '../shared/tree-node'

function makeRoot(val: number): TreeNode {
  return new TreeNode(val)
}
`
    const state = executeCode(code, { val: 9 }, 'makeRoot')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({ val: 9, left: null, right: null })
  })

  it('compiles code that references prepared classes', () => {
    const result = compileTypeScriptCode(`
function makeTrieNode(): TrieNode {
  return new TrieNode()
}
`)

    expect(result.success).toBe(true)
    expect(result.code).toContain('class TrieNode')
  })

  it('provides editor declarations for prepared classes referenced by LeetCode-style code', () => {
    const source = getPreparedTypeScriptEditorClassSource(`
function reverseList(head: ListNode | null): ListNode | null {
  return head
}
`)

    expect(source).toContain('class ListNode')
  })

  it('provides editor declarations for MinHeap and MaxHeap', () => {
    const source = getPreparedTypeScriptEditorClassSource(`
class MedianFinder {
  private minHeap = new MinHeap()
  private maxHeap = new MaxHeap()
}
`)

    expect(source).toContain('class MinHeap')
    expect(source).toContain('class MaxHeap')
  })

  it('provides editor declarations for _Node in clone-graph code', () => {
    const source = getPreparedTypeScriptEditorClassSource(`
function cloneGraph(node: _Node | null): _Node | null {
  return null
}
`)

    expect(source).toContain('class _Node')
  })

  it('omits editor declarations when the code declares the class locally', () => {
    const source = getPreparedTypeScriptEditorClassSource(`
class ListNode {
  val = 0
  next: ListNode | null = null
}
`)

    expect(source).not.toContain('class ListNode')
    expect(source).toContain('class TreeNode')
  })

  it('omits editor declarations for local classes while code is incomplete', () => {
    const source = getPreparedTypeScriptEditorClassSource(`
class TrieNode {
  children: Map<string, TrieNode>

class Trie {
  private root: TrieNode
}
`)

    expect(source).not.toContain('class TrieNode')
    expect(source).toContain('class TreeNode')
  })

  it('executes clone-graph style code with prepared _Node', () => {
    const code = `
function makeGraph(): _Node {
  const one = new _Node(1)
  const two = new _Node(2)
  one.neighbors.push(two)
  two.neighbors.push(one)
  return one
}
`
    const state = executeCode(code, {}, 'makeGraph')

    expect(state.error).toBeUndefined()
    expect((state.returnValue as { val?: number }).val).toBe(1)
    expect(
      (state.returnValue as { neighbors?: unknown[] }).neighbors?.length
    ).toBe(1)
  })

  it('executes graph code with prepared GraphNode', () => {
    const code = `
function degree(): number {
  const one = new GraphNode(1)
  const two = new GraphNode(2)
  one.neighbors = [two]
  return one.neighbors.length
}
`
    const state = executeCode(code, {}, 'degree')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(1)
  })

  it('executes N-ary tree code with prepared NaryNode', () => {
    const code = `
function childCount(): number {
  const root = new NaryNode(1, [new NaryNode(2), new NaryNode(3)])
  return root.children.length
}
`
    const state = executeCode(code, {}, 'childCount')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)
  })

  it('executes random-list code with prepared RandomListNode', () => {
    const code = `
function randomValue(): number {
  const one = new RandomListNode(1)
  const two = new RandomListNode(2)
  one.next = two
  one.random = two
  return one.random.val
}
`
    const state = executeCode(code, {}, 'randomValue')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)
  })

  it('executes doubly linked-list code with prepared DoublyListNode', () => {
    const code = `
function previousValue(): number {
  const one = new DoublyListNode(1)
  const two = new DoublyListNode(2, one)
  one.next = two
  return two.prev!.val
}
`
    const state = executeCode(code, {}, 'previousValue')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(1)
  })

  it('executes LeetCode-style Node code for graph and random-list shapes', () => {
    const code = `
function nodeShapes(): number {
  const graphNode = new Node(1, [new Node(2)])
  const randomNode = new Node(3, null, graphNode)
  return graphNode.neighbors.length + randomNode.random!.val
}
`
    const state = executeCode(code, {}, 'nodeShapes')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)
  })

  it('executes heap-style code with prepared PriorityQueue', () => {
    const code = `
function topTwo(): number[] {
  const pq = new PriorityQueue<number>((a, b) => b - a)
  pq.push(1)
  pq.push(5)
  pq.push(3)
  return [pq.pop()!, pq.pop()!]
}
`
    const state = executeCode(code, {}, 'topTwo')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([5, 3])
  })

  it('executes MedianFinder with prepared MinHeap and MaxHeap', () => {
    const code = `
class MedianFinder {
  private minHeap
  private maxHeap

  constructor() {
    this.minHeap = new MinHeap()
    this.maxHeap = new MaxHeap()
  }

  addNum(num: number): void {
    this.maxHeap.push(num)
    this.minHeap.push(this.maxHeap.pop())

    if (this.minHeap.size() > this.maxHeap.size()) {
      this.maxHeap.push(this.minHeap.pop())
    }
  }

  findMedian(): number {
    if (this.maxHeap.size() > this.minHeap.size()) {
      return this.maxHeap.peek()
    }

    return (this.maxHeap.peek() + this.minHeap.peek()) / 2
  }
}
`
    const inputs = createClassDesignInput(
      'MedianFinder',
      [
        'MedianFinder',
        'addNum',
        'addNum',
        'findMedian',
        'addNum',
        'findMedian',
      ],
      [[], [1], [2], [], [3], []]
    )
    const state = executeCode(code, inputs, 'MedianFinder')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([null, null, null, 1.5, null, 2])
  })

  it('executes sliding-window style code with prepared Deque', () => {
    const code = `
function ends(): number[] {
  const deque = new Deque<number>()
  deque.pushBack(2)
  deque.pushBack(3)
  deque.pushFront(1)
  return [deque.popFront()!, deque.back()!, deque.size]
}
`
    const state = executeCode(code, {}, 'ends')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([1, 3, 2])
  })

  it('executes connectivity code with prepared UnionFind', () => {
    const code = `
function connected(): boolean {
  const uf = new UnionFind<string>()
  uf.union('a', 'b')
  uf.union('b', 'c')
  return uf.connected('a', 'c')
}
`
    const state = executeCode(code, {}, 'connected')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)
  })

  it('executes string connectivity code with prepared DSU', () => {
    const code = `
function roots(): string[] {
  const dsu = new DSU()
  dsu.union('a', 'b')
  dsu.union('c', 'd')
  dsu.union('b', 'c')
  return [dsu.find('a'), dsu.find('d'), dsu.find('isolated')]
}
`
    const state = executeCode(code, {}, 'roots')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['a', 'a', 'isolated'])
  })

  it('executes accounts merge with prepared DSU and variable-length rows', () => {
    const code = `
function accountMerge(accounts: string[][]): string[][] {
  const dsu = new DSU()
  const emailToName = new Map<string, string>()
  const allEmails = new Set<string>()

  for (const account of accounts) {
    const name = account[0]
    const emails = account.slice(1)

    if (emails.length === 0) continue

    for (const email of emails) {
      emailToName.set(email, name)
      allEmails.add(email)
    }

    const first = emails[0]
    for (let i = 1; i < emails.length; i++) {
      dsu.union(first, emails[i])
    }
  }

  const groups = new Map<string, string[]>()
  for (const email of allEmails) {
    const root = dsu.find(email)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(email)
  }

  const res: string[][] = []
  for (const [root, emails] of groups) {
    emails.sort()
    const nameFromRoot = emailToName.get(root)
    const nameFromFirstEmail = emailToName.get(emails[0])
    const name = nameFromRoot ?? nameFromFirstEmail ?? ''
    res.push([name, ...emails])
  }

  return res
}
`
    const accounts = [
      ['John', 'johnsmith@mail.com', 'john_newyork@mail.com'],
      ['John', 'johnsmith@mail.com', 'john00@mail.com'],
      ['Mary', 'mary@mail.com'],
      ['John', 'johnnybravo@mail.com'],
    ]
    const state = executeCode(code, { accounts }, 'accountMerge')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([
      [
        'John',
        'john00@mail.com',
        'john_newyork@mail.com',
        'johnsmith@mail.com',
      ],
      ['Mary', 'mary@mail.com'],
      ['John', 'johnnybravo@mail.com'],
    ])
  })

  it('executes frequency code with prepared Counter', () => {
    const code = `
function countA(): number {
  const counter = new Counter<string>(['a', 'b', 'a'])
  counter.add('a')
  counter.add('b', -1)
  return counter.get('a') + counter.get('b')
}
`
    const state = executeCode(code, {}, 'countA')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)
  })
})
