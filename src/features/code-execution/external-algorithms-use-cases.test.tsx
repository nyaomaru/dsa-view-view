/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import type { FunctionParameter } from '@/entities/code'
import type { ExecutionState } from '@/entities/execution'
import { Visualizer } from '@/features/visualization/ui/visualizer'

import { executeCode } from './lib/runner'
import { convertInputValues } from './lib/structured-inputs'

const fallbackAlgorithms = {
  'sort/bubble-sort.ts': `
function bubbleSort(arr: number[]): number[] {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = temp
      }
    }
  }
  return arr
}
`,
  'sort/selection-sort.ts': `
function selectionSort(arr: number[]): number[] {
  for (let i = 0; i < arr.length; i++) {
    let minIndex = i
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIndex]) minIndex = j
    }
    const temp = arr[i]
    arr[i] = arr[minIndex]
    arr[minIndex] = temp
  }
  return arr
}
`,
  'binary-search/binary-search.ts': `
function binarySearch(arr: number[], target: number): number {
  let left = 0
  let right = arr.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) left = mid + 1
    else right = mid - 1
  }
  return -1
}
`,
  'binary-search/search-rotate.ts': `
function searchRotate(nums: number[], target: number): number {
  let left = 0
  let right = nums.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (nums[mid] === target) return mid
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) right = mid - 1
      else left = mid + 1
    } else {
      if (nums[mid] < target && target <= nums[right]) left = mid + 1
      else right = mid - 1
    }
  }
  return -1
}
`,
  'binary/missing-number.ts': `
function missingNumber(nums: number[]): number {
  let expected = nums.length
  for (let i = 0; i < nums.length; i++) expected += i - nums[i]
  return expected
}
`,
  'hash-map/two-sum.ts': `
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const pair = target - nums[i]
    if (seen.has(pair)) return [seen.get(pair)!, i]
    seen.set(nums[i], i)
  }
  return []
}
`,
  'hash-map/valid-anagram.ts': `
function validAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false
  const counts = new Map<string, number>()
  for (const char of s) counts.set(char, (counts.get(char) ?? 0) + 1)
  for (const char of t) {
    const next = (counts.get(char) ?? 0) - 1
    if (next < 0) return false
    counts.set(char, next)
  }
  return true
}
`,
  'stack/parentheses.ts': `
function isValid(s: string): boolean {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
  const stack: string[] = []
  for (const char of s) {
    if (char === '(' || char === '[' || char === '{') stack.push(char)
    else if (stack.pop() !== pairs[char]) return false
  }
  return stack.length === 0
}
`,
  'pointer/rain-trap.ts': `
function trap(height: number[]): number {
  let left = 0
  let right = height.length - 1
  let leftMax = 0
  let rightMax = 0
  let trappedWater = 0
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left])
      trappedWater += leftMax - height[left]
      left++
    } else {
      rightMax = Math.max(rightMax, height[right])
      trappedWater += rightMax - height[right]
      right--
    }
  }
  return trappedWater
}
`,
  'math/my-sqrt.ts': `
function mySqrt(x: number): number {
  let left = 0
  let right = x
  let answer = 0
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (mid * mid <= x) {
      answer = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return answer
}
`,
  'dynamic-programming/word-break.ts': `
function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict)
  const dp = Array(s.length + 1).fill(false)
  dp[0] = true
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) {
        dp[i] = true
        break
      }
    }
  }
  return dp[s.length]
}
`,
  'graphs/number-of-islands.ts': `
function numIslands(grid: string[][]): number {
  let count = 0
  const visit = (row: number, col: number): void => {
    if (row < 0 || col < 0 || row >= grid.length || col >= grid[row].length) return
    if (grid[row][col] !== '1') return
    grid[row][col] = '0'
    visit(row + 1, col)
    visit(row - 1, col)
    visit(row, col + 1)
    visit(row, col - 1)
  }
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === '1') {
        count++
        visit(row, col)
      }
    }
  }
  return count
}
`,
  'matrix/flood-fill.ts': `
function floodFill(matrix: number[][], sr: number, sc: number, color: number): number[][] {
  const original = matrix[sr][sc]
  if (original === color) return matrix
  const fill = (row: number, col: number): void => {
    if (row < 0 || col < 0 || row >= matrix.length || col >= matrix[row].length) return
    if (matrix[row][col] !== original) return
    matrix[row][col] = color
    fill(row + 1, col)
    fill(row - 1, col)
    fill(row, col + 1)
    fill(row, col - 1)
  }
  fill(sr, sc)
  return matrix
}
`,
  'tree/max-depth.ts': `
function maxDepth(root: TreeNode | null): number {
  if (root === null) return 0
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1
}
`,
  'binary-search-tree/invert-binary-tree.ts': `
function invertTree(root: TreeNode | null): TreeNode | null {
  if (root === null) return null
  const left = invertTree(root.left)
  const right = invertTree(root.right)
  root.left = right
  root.right = left
  return root
}
`,
  'linked-list/reverse-list.ts': `
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null
  let current: ListNode | null = head
  while (current !== null) {
    const next = current.next
    current.next = prev
    prev = current
    current = next
  }
  return prev
}
`,
  'linked-list/merge-two-lists.ts': `
function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  const dummy = new ListNode(0)
  let current = dummy
  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      current.next = list1
      list1 = list1.next
    } else {
      current.next = list2
      list2 = list2.next
    }
    current = current.next
  }
  current.next = list1 ?? list2
  return dummy.next
}
`,
} as const

function loadAlgorithm(path: keyof typeof fallbackAlgorithms): string {
  const externalPath = fileURLToPath(
    new URL(`../../../../algorithms/${path}`, import.meta.url)
  )

  return existsSync(externalPath)
    ? readFileSync(externalPath, 'utf8')
    : fallbackAlgorithms[path]
}

const bubbleSortCode = loadAlgorithm('sort/bubble-sort.ts')
const selectionSortCode = loadAlgorithm('sort/selection-sort.ts')
const binarySearchCode = loadAlgorithm('binary-search/binary-search.ts')
const searchRotateCode = loadAlgorithm('binary-search/search-rotate.ts')
const missingNumberCode = loadAlgorithm('binary/missing-number.ts')
const twoSumCode = loadAlgorithm('hash-map/two-sum.ts')
const validAnagramCode = loadAlgorithm('hash-map/valid-anagram.ts')
const parenthesesCode = loadAlgorithm('stack/parentheses.ts')
const rainTrapCode = loadAlgorithm('pointer/rain-trap.ts')
const maxAreaCode = `
function maxArea(height: number[]): number {
  let l = 0
  let r = height.length - 1
  let best = 0

  while (l < r) {
    const w = r - l
    const h = Math.min(height[l], height[r])

    best = Math.max(best, h * w)

    if (height[l] <= height[r]) {
      l++
    } else {
      r--
    }
  }

  return best
}
`
const largestRectangleAreaCode = `
function largestRectangleArea(heights: number[]): number {
  const hs = [...heights, 0];
  const stack: number[] = [];
  let ans = 0;

  for (let i = 0; i < hs.length; i++) {
    while (stack.length > 0 && hs[stack[stack.length - 1]] > hs[i]) {
      const mid = stack.pop()!;
      const h = hs[mid];
      const leftSmallIndex = stack.length > 0 ? stack[stack.length - 1] : -1;
      const width = i - leftSmallIndex - 1;
      ans = Math.max(ans, h * width);
    }
    stack.push(i);
  }

  return ans;
}
`
const minWindowCode = `
function minWindow(s: string, t: string): string {
  if (t.length === 0 || s.length === 0) return ''

  const need = new Map<string, number>()
  for (const char of t) {
    need.set(char, (need.get(char) || 0) + 1)
  }

  const have = new Map<string, number>()
  const required = need.size
  let formed = 0
  let l = 0
  let bestLen = Infinity
  let bestL = 0

  for (let r = 0; r < s.length; r++) {
    const char = s[r]
    have.set(char, (have.get(char) || 0) + 1)

    if (need.has(char) && have.get(char) === need.get(char)) formed++

    while (l <= r && formed === required) {
      const windowLen = r - l + 1
      if (windowLen < bestLen) {
        bestLen = windowLen
        bestL = l
      }

      const leftChar = s[l]
      have.set(leftChar, have.get(leftChar)! - 1)
      if (need.has(leftChar) && have.get(leftChar)! < need.get(leftChar)) {
        formed--
      }
      l++
    }
  }

  return bestLen === Infinity ? '' : s.slice(bestL, bestL + bestLen)
}
`
const mySqrtCode = loadAlgorithm('math/my-sqrt.ts')
const wordBreakCode = loadAlgorithm('dynamic-programming/word-break.ts')
const numIslandsCode = loadAlgorithm('graphs/number-of-islands.ts')
const floodFillCode = loadAlgorithm('matrix/flood-fill.ts')
const maxDepthCode = loadAlgorithm('tree/max-depth.ts')
const kthSmallestCode = `
function kthSmallest(root: TreeNode | null, k: number): number {
  const arr: number[] = []

  function dfs(node: TreeNode | null) {
    if (!node) return

    dfs(node.left)
    arr.push(node.val)
    dfs(node.right)
  }

  dfs(root)
  return arr[k - 1]
}
`
const invertTreeCode = loadAlgorithm('binary-search-tree/invert-binary-tree.ts')
const reverseListCode = loadAlgorithm('linked-list/reverse-list.ts')
const mergeTwoListsCode = loadAlgorithm('linked-list/merge-two-lists.ts')

type TestListNode = {
  val: number
  next: TestListNode | null
}

type TestTreeNode = {
  val: number
  left: TestTreeNode | null
  right: TestTreeNode | null
}

const noop = () => {}

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true,
})

function listToArray(node: TestListNode | null): number[] {
  const values: number[] = []
  let current = node

  while (current) {
    values.push(current.val)
    current = current.next
  }

  return values
}

function treeToLevelOrder(root: TestTreeNode | null): Array<number | null> {
  if (!root) return []

  const values: Array<number | null> = []
  const queue: Array<TestTreeNode | null> = [root]

  while (queue.length > 0) {
    const node = queue.shift() ?? null

    if (!node) {
      values.push(null)
      continue
    }

    values.push(node.val)
    queue.push(node.left)
    queue.push(node.right)
  }

  while (values[values.length - 1] === null) {
    values.pop()
  }

  return values
}

function findVisualizationStep(
  state: ExecutionState,
  predicate: (variables: Record<string, unknown>) => boolean
): number {
  let index = -1

  for (let stepIndex = state.steps.length - 1; stepIndex >= 0; stepIndex -= 1) {
    if (predicate(state.steps[stepIndex].variables)) {
      index = stepIndex
      break
    }
  }

  expect(index).toBeGreaterThanOrEqual(0)
  return index
}

function completeAtStep(
  state: ExecutionState,
  currentStep: number
): ExecutionState {
  return {
    ...state,
    currentStep,
    isComplete: true,
  }
}

function renderVisualizer(
  executionState: ExecutionState,
  autoOpenPrimaryVisualization = false
) {
  render(
    <Visualizer
      executionState={executionState}
      isRunning={false}
      autoOpenPrimaryVisualization={autoOpenPrimaryVisualization}
      onPause={noop}
      onRunAll={noop}
      onReset={noop}
      onStepForward={noop}
      onStepBackward={noop}
      onSkipToEnd={noop}
      onJumpToStep={noop}
    />
  )
}

function expectNoStructureView() {
  expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()
  expect(screen.queryByText('Area View')).not.toBeInTheDocument()
  expect(screen.queryByText('Map View')).not.toBeInTheDocument()
  expect(screen.queryByText('Matrix View')).not.toBeInTheDocument()
  expect(screen.queryByText('Tree Graph')).not.toBeInTheDocument()
  expect(screen.queryByText('List Graph')).not.toBeInTheDocument()
}

describe('external algorithms use cases', () => {
  it('runs bubble sort and exposes the sort graph view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'arr', type: 'number-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, { arr: '5,1,4,2,8' })

    const state = executeCode(bubbleSortCode, inputs, 'bubbleSort')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([1, 2, 4, 5, 8])

    const currentStep = findVisualizationStep(state, (variables) =>
      Array.isArray(variables.arr)
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('Sort Graph')).toBeInTheDocument()
  })

  it('runs selection sort and exposes the sort graph view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'arr', type: 'number-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, { arr: '64,25,12,22,11' })

    const state = executeCode(selectionSortCode, inputs, 'selectionSort')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([11, 12, 22, 25, 64])

    const currentStep = findVisualizationStep(state, (variables) =>
      Array.isArray(variables.arr)
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('Sort Graph')).toBeInTheDocument()
  })

  it('runs two sum and exposes the map view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'target', type: 'number', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      nums: '2,7,11,15',
      target: '9',
    })

    const state = executeCode(twoSumCode, inputs, 'twoSum')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([0, 1])

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expect(screen.getByText('Map View')).toBeInTheDocument()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs binary search without exposing a sort graph for a read-only array', () => {
    const parameters: FunctionParameter[] = [
      { name: 'arr', type: 'number-array', optional: false },
      { name: 'target', type: 'number', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      arr: '1,3,5,7,9',
      target: '7',
    })

    const state = executeCode(binarySearchCode, inputs, 'binarySearch')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)

    const currentStep = findVisualizationStep(state, (variables) =>
      Array.isArray(variables.arr)
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs rotated-array search and shows only the return value view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
      { name: 'target', type: 'number', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      nums: '4,5,6,7,0,1,2',
      target: '0',
    })

    const state = executeCode(searchRotateCode, inputs, 'searchRotate')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(4)

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expectNoStructureView()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs missing number and shows only the return value view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'nums', type: 'number-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      nums: '3,0,1',
    })

    const state = executeCode(missingNumberCode, inputs, 'missingNumber')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expectNoStructureView()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs valid anagram and exposes the map view', () => {
    const parameters: FunctionParameter[] = [
      { name: 's', type: 'string', optional: false },
      { name: 't', type: 'string', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      s: 'anagram',
      t: 'nagaram',
    })

    const state = executeCode(validAnagramCode, inputs, 'validAnagram')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expect(screen.getByText('Map View')).toBeInTheDocument()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs valid parentheses without exposing a structure view', () => {
    const parameters: FunctionParameter[] = [
      { name: 's', type: 'string', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      s: '()[]{}',
    })

    const state = executeCode(parenthesesCode, inputs, 'isValid')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expectNoStructureView()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs minimum window substring and exposes the sliding window view', () => {
    const parameters: FunctionParameter[] = [
      { name: 's', type: 'string', optional: false },
      { name: 't', type: 'string', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      s: 'ADOBECODEBANC',
      t: 'ABC',
    })
    const state = executeCode(minWindowCode, inputs, 'minWindow')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('BANC')

    const currentStep = findVisualizationStep(state, (variables) => {
      const left = variables.l
      const right = variables.r

      return (
        Number.isInteger(left) &&
        Number.isInteger(right) &&
        Number(left) <= Number(right)
      )
    })
    renderVisualizer(
      {
        ...state,
        currentStep,
        isComplete: false,
      },
      true
    )

    expect(
      screen.getByRole('heading', { name: 'Sliding Window View: s' })
    ).toBeInTheDocument()
    expect(screen.getByText('pattern: ABC')).toBeInTheDocument()
  })

  it('runs trapping rain water and opens the area view', async () => {
    const parameters: FunctionParameter[] = [
      { name: 'height', type: 'number-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      height: '0,1,0,2,1,0,1,3,2,1,2,1',
    })

    const state = executeCode(rainTrapCode, inputs, 'trap')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(6)

    renderVisualizer(completeAtStep(state, state.steps.length - 1), true)

    expect(screen.getByText('Area View')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Rain Water View: height' })
    ).toBeInTheDocument()
  })

  it('runs container with most water and exposes the area view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'height', type: 'number-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      height: '1,8,6,2,5,4,8,3,7',
    })

    const state = executeCode(maxAreaCode, inputs, 'maxArea')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(49)

    const currentStep = findVisualizationStep(
      state,
      (variables) =>
        Array.isArray(variables.height) &&
        typeof variables.l === 'number' &&
        typeof variables.r === 'number' &&
        variables.l < variables.r
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('Area View')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Area View'))

    expect(
      screen.getByRole('heading', { level: 2, name: 'Area View: height' })
    ).toBeInTheDocument()
    expect(screen.getByText('L=1')).toBeInTheDocument()
    expect(screen.getByText('R=8')).toBeInTheDocument()
    expect(screen.getByText('area=49')).toBeInTheDocument()
  })

  it('runs largest rectangle and exposes the histogram area view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'heights', type: 'number-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      heights: '2,1,5,6,2,3',
    })

    const state = executeCode(
      largestRectangleAreaCode,
      inputs,
      'largestRectangleArea'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(10)

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    fireEvent.click(screen.getByText('Area View'))

    expect(
      screen.getByRole('heading', { level: 2, name: 'Area View: hs' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Rectangle Area View: hs' })
    ).toBeInTheDocument()
    expect(screen.getByText('stack=[1]')).toBeInTheDocument()
    expect(screen.getByText('area=10')).toBeInTheDocument()
    expect(screen.getByText('best=10')).toBeInTheDocument()
  })

  it('runs integer square root and shows only the return value view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'x', type: 'number', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      x: '8',
    })

    const state = executeCode(mySqrtCode, inputs, 'mySqrt')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expectNoStructureView()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs word break and shows only the return value view', () => {
    const parameters: FunctionParameter[] = [
      { name: 's', type: 'string', optional: false },
      { name: 'wordDict', type: 'string-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      s: 'leetcode',
      wordDict: 'leet,code',
    })

    const state = executeCode(wordBreakCode, inputs, 'wordBreak')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expectNoStructureView()
    expect(screen.getByText('Return Value')).toBeInTheDocument()
  })

  it('runs number of islands and exposes the matrix view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'grid', type: 'string-matrix', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      grid: JSON.stringify([
        ['1', '1', '0', '0', '0'],
        ['1', '1', '0', '0', '0'],
        ['0', '0', '1', '0', '0'],
        ['0', '0', '0', '1', '1'],
      ]),
    })

    const state = executeCode(numIslandsCode, inputs, 'numIslands')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)

    const currentStep = findVisualizationStep(state, (variables) =>
      Array.isArray(variables.grid)
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('Matrix View')).toBeInTheDocument()
  })

  it('runs flood fill and exposes the matrix view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'matrix', type: 'number-matrix', optional: false },
      { name: 'sr', type: 'number', optional: false },
      { name: 'sc', type: 'number', optional: false },
      { name: 'color', type: 'number', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      matrix: JSON.stringify([
        [1, 1, 1],
        [1, 1, 0],
        [1, 0, 1],
      ]),
      sr: '1',
      sc: '1',
      color: '2',
    })

    const state = executeCode(floodFillCode, inputs, 'floodFill')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([
      [2, 2, 2],
      [2, 2, 0],
      [2, 0, 1],
    ])

    const currentStep = findVisualizationStep(state, (variables) =>
      Array.isArray(variables.matrix)
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('Matrix View')).toBeInTheDocument()
  })

  it('runs max depth on a tree input and exposes the tree graph view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'root', type: 'tree-node', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      root: '[3,9,20,null,null,15,7]',
    })

    const state = executeCode(maxDepthCode, inputs, 'maxDepth')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)

    const currentStep = findVisualizationStep(
      state,
      (variables) => (variables.root as TestTreeNode | undefined)?.val === 3
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('Tree Graph')).toBeInTheDocument()
  })

  it('shows a derived inorder array as the primary Stack View', () => {
    const parameters: FunctionParameter[] = [
      { name: 'root', type: 'tree-node', optional: false },
      { name: 'k', type: 'number', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      root: '[2,1,3]',
      k: '2',
    })
    const state = executeCode(kthSmallestCode, inputs, 'kthSmallest')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)

    const currentStep = findVisualizationStep(
      state,
      (variables) => Array.isArray(variables.arr) && variables.arr.length === 3
    )
    renderVisualizer(
      {
        ...state,
        currentStep,
        isComplete: false,
      },
      true
    )

    expect(screen.getByText('Stack Visualization: arr')).toBeInTheDocument()
  })

  it('runs invert tree and exposes the tree graph view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'root', type: 'tree-node', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      root: '[4,2,7,1,3,6,9]',
    })

    const state = executeCode(invertTreeCode, inputs, 'invertTree')

    expect(state.error).toBeUndefined()
    expect(treeToLevelOrder(state.returnValue as TestTreeNode | null)).toEqual([
      4, 7, 2, 9, 6, 3, 1,
    ])

    const currentStep = findVisualizationStep(
      state,
      (variables) => (variables.root as TestTreeNode | undefined)?.val === 4
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('Tree Graph')).toBeInTheDocument()
  })

  it('runs build tree and exposes the returned root as a tree graph view', () => {
    const code = `
function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
  if (preorder.length === 0) return null

  const indexMap = new Map<number, number>()
  for (let i = 0; i < inorder.length; i++) {
    indexMap.set(inorder[i], i)
  }

  function build(
    preStart: number,
    preEnd: number,
    inStart: number,
    inEnd: number
  ) {
    if (preStart > preEnd || inStart > inEnd) return null

    const rootVal = preorder[preStart]
    const root = new TreeNode(rootVal)

    const rootIndex = indexMap.get(rootVal)
    const leftSize = rootIndex - inStart

    root.left = build(preStart + 1, preStart + leftSize, inStart, rootIndex - 1)
    root.right = build(preStart + leftSize + 1, preEnd, rootIndex + 1, inEnd)

    return root
  }

  return build(0, preorder.length - 1, 0, inorder.length - 1)
}
`
    const parameters: FunctionParameter[] = [
      { name: 'preorder', type: 'number-array', optional: false },
      { name: 'inorder', type: 'number-array', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      preorder: '3,9,20,15,7',
      inorder: '9,3,15,20,7',
    })

    const state = executeCode(code, inputs, 'buildTree')

    expect(state.error).toBeUndefined()
    expect(treeToLevelOrder(state.returnValue as TestTreeNode | null)).toEqual([
      3,
      9,
      20,
      null,
      null,
      15,
      7,
    ])

    renderVisualizer(completeAtStep(state, state.steps.length - 1))

    expect(screen.getByText('Tree Graph')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Tree Graph'))
    expect(screen.getByText('Tree Graph: root')).toBeInTheDocument()
  })

  it('runs reverse list on a linked-list input and exposes the list graph view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'head', type: 'list-node', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      head: {
        values: '[1,2,3,4,5]',
        pos: '-1',
      },
    })

    const state = executeCode(reverseListCode, inputs, 'reverseList')

    expect(state.error).toBeUndefined()
    expect(listToArray(state.returnValue as TestListNode | null)).toEqual([
      5, 4, 3, 2, 1,
    ])

    const currentStep = findVisualizationStep(state, (variables) =>
      Boolean(variables.head)
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('List Graph')).toBeInTheDocument()
  })

  it('runs merge two lists and exposes the list graph view', () => {
    const parameters: FunctionParameter[] = [
      { name: 'list1', type: 'list-node', optional: false },
      { name: 'list2', type: 'list-node', optional: false },
    ]
    const inputs = convertInputValues(parameters, {
      list1: {
        values: '[1,2,4]',
        pos: '-1',
      },
      list2: {
        values: '[1,3,4]',
        pos: '-1',
      },
    })

    const state = executeCode(mergeTwoListsCode, inputs, 'mergeTwoLists')

    expect(state.error).toBeUndefined()
    expect(listToArray(state.returnValue as TestListNode | null)).toEqual([
      1, 1, 2, 3, 4, 4,
    ])

    const currentStep = findVisualizationStep(state, (variables) =>
      Boolean(variables.list1)
    )
    renderVisualizer(completeAtStep(state, currentStep))

    expect(screen.getByText('List Graph')).toBeInTheDocument()
  })
})
