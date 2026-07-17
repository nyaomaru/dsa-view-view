import { parse } from '@babel/parser'
import { isPreparedTypeScriptClassName } from '../model/prepared-class-name'

/**
 * Built-in class definition injected when user code references a common DSA type.
 */
type PreparedClassDefinition = {
  /** Global class name made available when user code does not declare it. */
  name: string
  /** TypeScript source inserted before user code. Keep runtime behavior LeetCode-like. */
  source: string
}

/**
 * Source variants produced after resolving prepared class declarations.
 */
type PreparedCode = {
  /** Full source used by compile-only paths. */
  code: string
  /** User source with prepared-class imports removed, but without injected classes. */
  userCode: string
  /** Injected class source. Execution prepends this after instrumenting userCode. */
  prelude: string
  /** Number of injected lines, used to map compile errors back to editor lines. */
  preludeLineCount: number
}

const PREPARED_CLASSES: PreparedClassDefinition[] = [
  {
    name: 'TreeNode',
    source: `
class TreeNode {
  val: number
  left: TreeNode | null
  right: TreeNode | null

  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = val === undefined ? 0 : val
    this.left = left === undefined ? null : left
    this.right = right === undefined ? null : right
  }
}`,
  },
  {
    name: 'ListNode',
    source: `
class ListNode {
  val: number
  next: ListNode | null

  constructor(val?: number, next?: ListNode | null) {
    this.val = val === undefined ? 0 : val
    this.next = next === undefined ? null : next
  }
}`,
  },
  {
    name: 'TrieNode',
    source: `
class TrieNode {
  children: Map<string, TrieNode>
  isEnd: boolean

  constructor() {
    this.children = new Map()
    this.isEnd = false
  }
}`,
  },
  {
    name: '_Node',
    source: `
class _Node {
  val: number
  neighbors: _Node[]

  constructor(val?: number, neighbors?: _Node[]) {
    this.val = val === undefined ? 0 : val
    this.neighbors = neighbors === undefined ? [] : neighbors
  }
}`,
  },
  {
    name: 'GraphNode',
    source: `
class GraphNode {
  val: number
  neighbors: GraphNode[]

  constructor(val?: number, neighbors?: GraphNode[]) {
    this.val = val === undefined ? 0 : val
    this.neighbors = neighbors === undefined ? [] : neighbors
  }
}`,
  },
  {
    name: 'NaryNode',
    source: `
class NaryNode {
  val: number
  children: NaryNode[]

  constructor(val?: number, children?: NaryNode[]) {
    this.val = val === undefined ? 0 : val
    this.children = children === undefined ? [] : children
  }
}`,
  },
  {
    name: 'RandomListNode',
    source: `
class RandomListNode {
  val: number
  next: RandomListNode | null
  random: RandomListNode | null

  constructor(
    val?: number,
    next?: RandomListNode | null,
    random?: RandomListNode | null,
  ) {
    this.val = val === undefined ? 0 : val
    this.next = next === undefined ? null : next
    this.random = random === undefined ? null : random
  }
}`,
  },
  {
    name: 'DoublyListNode',
    source: `
class DoublyListNode {
  val: number
  prev: DoublyListNode | null
  next: DoublyListNode | null

  constructor(
    val?: number,
    prev?: DoublyListNode | null,
    next?: DoublyListNode | null,
  ) {
    this.val = val === undefined ? 0 : val
    this.prev = prev === undefined ? null : prev
    this.next = next === undefined ? null : next
  }
}`,
  },
  {
    name: 'Node',
    source: `
class Node {
  val: number
  neighbors: Node[]
  children: Node[]
  next: Node | null
  random: Node | null
  prev: Node | null

  constructor(
    val?: number,
    second?: Node[] | Node | null,
    third?: Node | null,
  ) {
    this.val = val === undefined ? 0 : val
    this.neighbors = Array.isArray(second) ? second : []
    this.children = Array.isArray(second) ? second : []
    this.next = !Array.isArray(second) && second !== undefined ? second : null
    this.random = third === undefined ? null : third
    this.prev = null
  }
}`,
  },
  {
    name: 'PriorityQueue',
    source: `
class PriorityQueue<T> {
  private values: T[] = []
  private compare: (a: T, b: T) => number

  constructor(compare?: (a: T, b: T) => number) {
    this.compare = compare ?? ((a, b) => Number(a) - Number(b))
  }

  get size(): number {
    return this.values.length
  }

  isEmpty(): boolean {
    return this.values.length === 0
  }

  enqueue(value: T): void {
    this.values.push(value)
    this.bubbleUp(this.values.length - 1)
  }

  push(value: T): void {
    this.enqueue(value)
  }

  peek(): T | undefined {
    return this.values[0]
  }

  dequeue(): T | undefined {
    if (this.values.length === 0) return undefined
    const top = this.values[0]
    const last = this.values.pop()!

    if (this.values.length > 0) {
      this.values[0] = last
      this.bubbleDown(0)
    }

    return top
  }

  pop(): T | undefined {
    return this.dequeue()
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.compare(this.values[parent], this.values[index]) <= 0) break
      ;[this.values[parent], this.values[index]] = [this.values[index], this.values[parent]]
      index = parent
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = index * 2 + 1
      const right = index * 2 + 2
      let best = index

      if (
        left < this.values.length &&
        this.compare(this.values[left], this.values[best]) < 0
      ) {
        best = left
      }

      if (
        right < this.values.length &&
        this.compare(this.values[right], this.values[best]) < 0
      ) {
        best = right
      }

      if (best === index) break
      ;[this.values[index], this.values[best]] = [this.values[best], this.values[index]]
      index = best
    }
  }
}`,
  },
  {
    name: 'MinHeap',
    source: `
class MinHeap {
  private values: number[] = []

  constructor() {
    Object.defineProperty(this, '__algorithmVisualizerHeapKind', {
      value: 'min',
    })
  }

  size(): number {
    return this.values.length
  }

  isEmpty(): boolean {
    return this.values.length === 0
  }

  peek(): number {
    if (this.values.length === 0) throw new Error('Cannot peek an empty MinHeap')
    return this.values[0]
  }

  push(value: number): void {
    this.values.push(value)
    this.bubbleUp(this.values.length - 1)
  }

  pop(): number {
    if (this.values.length === 0) throw new Error('Cannot pop an empty MinHeap')
    const top = this.values[0]
    const last = this.values.pop()!

    if (this.values.length > 0) {
      this.values[0] = last
      this.bubbleDown(0)
    }

    return top
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.values[parent] <= this.values[index]) break
      ;[this.values[parent], this.values[index]] = [this.values[index], this.values[parent]]
      index = parent
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = index * 2 + 1
      const right = index * 2 + 2
      let smallest = index

      if (
        left < this.values.length &&
        this.values[left] < this.values[smallest]
      ) {
        smallest = left
      }

      if (
        right < this.values.length &&
        this.values[right] < this.values[smallest]
      ) {
        smallest = right
      }

      if (smallest === index) break
      ;[this.values[index], this.values[smallest]] = [this.values[smallest], this.values[index]]
      index = smallest
    }
  }
}`,
  },
  {
    name: 'MaxHeap',
    source: `
class MaxHeap {
  private values: number[] = []

  constructor() {
    Object.defineProperty(this, '__algorithmVisualizerHeapKind', {
      value: 'max',
    })
  }

  size(): number {
    return this.values.length
  }

  isEmpty(): boolean {
    return this.values.length === 0
  }

  peek(): number {
    if (this.values.length === 0) throw new Error('Cannot peek an empty MaxHeap')
    return this.values[0]
  }

  push(value: number): void {
    this.values.push(value)
    this.bubbleUp(this.values.length - 1)
  }

  pop(): number {
    if (this.values.length === 0) throw new Error('Cannot pop an empty MaxHeap')
    const top = this.values[0]
    const last = this.values.pop()!

    if (this.values.length > 0) {
      this.values[0] = last
      this.bubbleDown(0)
    }

    return top
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.values[parent] >= this.values[index]) break
      ;[this.values[parent], this.values[index]] = [this.values[index], this.values[parent]]
      index = parent
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = index * 2 + 1
      const right = index * 2 + 2
      let largest = index

      if (
        left < this.values.length &&
        this.values[left] > this.values[largest]
      ) {
        largest = left
      }

      if (
        right < this.values.length &&
        this.values[right] > this.values[largest]
      ) {
        largest = right
      }

      if (largest === index) break
      ;[this.values[index], this.values[largest]] = [this.values[largest], this.values[index]]
      index = largest
    }
  }
}`,
  },
  {
    name: 'Deque',
    source: `
class Deque<T> {
  private values: T[] = []
  private head = 0

  get size(): number {
    return this.values.length - this.head
  }

  isEmpty(): boolean {
    return this.size === 0
  }

  pushBack(value: T): void {
    this.values.push(value)
  }

  pushFront(value: T): void {
    if (this.head > 0) {
      this.head -= 1
      this.values[this.head] = value
      return
    }

    this.values.unshift(value)
  }

  popBack(): T | undefined {
    if (this.isEmpty()) return undefined
    const value = this.values.pop()
    if (this.head > this.values.length) this.head = this.values.length
    return value
  }

  popFront(): T | undefined {
    if (this.isEmpty()) return undefined
    const value = this.values[this.head]
    this.head += 1
    this.compact()
    return value
  }

  front(): T | undefined {
    return this.isEmpty() ? undefined : this.values[this.head]
  }

  back(): T | undefined {
    return this.isEmpty() ? undefined : this.values[this.values.length - 1]
  }

  private compact(): void {
    if (this.head > 32 && this.head * 2 > this.values.length) {
      this.values = this.values.slice(this.head)
      this.head = 0
    }
  }
}`,
  },
  {
    name: 'UnionFind',
    source: `
class UnionFind<T> {
  private parent = new Map<T, T>()
  private rank = new Map<T, number>()

  add(value: T): void {
    if (!this.parent.has(value)) {
      this.parent.set(value, value)
      this.rank.set(value, 1)
    }
  }

  find(value: T): T {
    this.add(value)
    const parent = this.parent.get(value)!

    if (parent !== value) {
      const root = this.find(parent)
      this.parent.set(value, root)
    }

    return this.parent.get(value)!
  }

  union(a: T, b: T): boolean {
    const rootA = this.find(a)
    const rootB = this.find(b)

    if (rootA === rootB) return false

    const rankA = this.rank.get(rootA)!
    const rankB = this.rank.get(rootB)!

    if (rankA < rankB) {
      this.parent.set(rootA, rootB)
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA)
    } else {
      this.parent.set(rootB, rootA)
      this.rank.set(rootA, rankA + 1)
    }

    return true
  }

  connected(a: T, b: T): boolean {
    return this.find(a) === this.find(b)
  }
}`,
  },
  {
    name: 'DSU',
    source: `
class DSU {
  private parent = new Map<string, string>()
  private rank = new Map<string, number>()

  private make(x: string): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x)
      this.rank.set(x, 1)
    }
  }

  find(x: string): string {
    this.make(x)
    const parent = this.parent.get(x)!

    if (parent !== x) {
      const root = this.find(parent)
      this.parent.set(x, root)
    }

    return this.parent.get(x)!
  }

  union(a: string, b: string): void {
    const rootA = this.find(a)
    const rootB = this.find(b)

    if (rootA === rootB) return

    const rankA = this.rank.get(rootA)!
    const rankB = this.rank.get(rootB)!

    if (rankA < rankB) {
      this.parent.set(rootA, rootB)
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA)
    } else {
      this.parent.set(rootB, rootA)
      this.rank.set(rootA, rankA + 1)
    }
  }
}`,
  },
  {
    name: 'Counter',
    source: `
class Counter<T> {
  private counts = new Map<T, number>()

  constructor(values?: Iterable<T>) {
    if (values) {
      for (const value of values) {
        this.add(value)
      }
    }
  }

  add(value: T, amount = 1): number {
    const next = this.get(value) + amount

    if (next <= 0) {
      this.counts.delete(value)
      return 0
    }

    this.counts.set(value, next)
    return next
  }

  get(value: T): number {
    return this.counts.get(value) ?? 0
  }

  has(value: T): boolean {
    return this.counts.has(value)
  }

  delete(value: T): boolean {
    return this.counts.delete(value)
  }

  entries(): IterableIterator<[T, number]> {
    return this.counts.entries()
  }

  keys(): IterableIterator<T> {
    return this.counts.keys()
  }

  values(): IterableIterator<number> {
    return this.counts.values()
  }
}`,
  },
]

const PARSER_OPTIONS = {
  sourceType: 'module' as const,
  plugins: ['typescript' as const],
}

const countLines = (value: string): number =>
  value === '' ? 0 : value.split('\n').length

function collectSyntacticDeclarationNames(code: string): Set<string> {
  const declarations = new Set<string>()
  const declarationPattern =
    /(?:^|[;{}\n])\s*(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type)\s+([A-Za-z_$][\w$]*)\b/g

  for (const match of code.matchAll(declarationPattern)) {
    declarations.add(match[1])
  }

  return declarations
}

/** Preserve editor line numbers by replacing stripped imports with blank lines. */
function replaceLineRangeWithBlanks(
  code: string,
  startLine: number,
  endLine: number
): string {
  const lines = code.split('\n')

  for (let index = startLine - 1; index <= endLine - 1; index += 1) {
    lines[index] = ''
  }

  return lines.join('\n')
}

/** Detect local declarations so editor-defined classes/types override prepared ones. */
function collectLocalDeclarations(code: string): Set<string> {
  const declarations = collectSyntacticDeclarationNames(code)

  try {
    const ast = parse(code, PARSER_OPTIONS)

    ast.program.body.forEach((node) => {
      if (
        node.type === 'ClassDeclaration' ||
        node.type === 'TSInterfaceDeclaration' ||
        node.type === 'TSTypeAliasDeclaration'
      ) {
        if (node.id?.name) declarations.add(node.id.name)
      }
    })
  } catch {
    // Keep the syntactic declaration names so user code wins while being edited.
  }

  return declarations
}

/** Remove imports for prepared classes because browser execution has no module resolver. */
function stripPreparedClassImports(code: string): string {
  try {
    const ast = parse(code, PARSER_OPTIONS)
    let nextCode = code

    ast.program.body
      .filter((node) => node.type === 'ImportDeclaration')
      .reverse()
      .forEach((node) => {
        const importsPreparedClass = node.specifiers.some((specifier) => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            return isPreparedTypeScriptClassName(specifier.local.name)
          }

          if (specifier.type === 'ImportSpecifier') {
            return isPreparedTypeScriptClassName(specifier.local.name)
          }

          return false
        })

        if (importsPreparedClass && node.loc) {
          nextCode = replaceLineRangeWithBlanks(
            nextCode,
            node.loc.start.line,
            node.loc.end.line
          )
        }
      })

    return nextCode
  } catch {
    return code
  }
}

/** Add common algorithm classes unless user code already defines the same names. */
export function prepareTypeScriptCodeWithClasses(code: string): PreparedCode {
  const codeWithoutPreparedImports = stripPreparedClassImports(code)
  const localDeclarations = collectLocalDeclarations(codeWithoutPreparedImports)
  const prelude = PREPARED_CLASSES.filter(
    (definition) => !localDeclarations.has(definition.name)
  )
    .map((definition) => definition.source.trim())
    .join('\n\n')

  if (!prelude) {
    return {
      code: codeWithoutPreparedImports,
      userCode: codeWithoutPreparedImports,
      prelude: '',
      preludeLineCount: 0,
    }
  }

  return {
    code: `${prelude}\n\n${codeWithoutPreparedImports}`,
    userCode: codeWithoutPreparedImports,
    prelude,
    preludeLineCount: countLines(prelude) + 2,
  }
}

/** Source used by Monaco so editor diagnostics match runtime prepared classes. */
export function getPreparedTypeScriptEditorClassSource(code: string): string {
  const codeWithoutPreparedImports = stripPreparedClassImports(code)
  const localDeclarations = collectLocalDeclarations(codeWithoutPreparedImports)

  return PREPARED_CLASSES.filter(
    (definition) => !localDeclarations.has(definition.name)
  )
    .map((definition) => definition.source.trim())
    .join('\n\n')
}
