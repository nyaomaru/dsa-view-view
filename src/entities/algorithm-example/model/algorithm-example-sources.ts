export const ALGORITHM_EXAMPLE_SOURCES = {
  'two-sum': `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]

    if (seen.has(complement)) {
      return [seen.get(complement)!, i]
    }

    seen.set(nums[i], i)
  }

  return []
}`,
  'binary-search': `function binarySearch(nums: number[], target: number): number {
  let left = 0
  let right = nums.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    if (nums[mid] === target) return mid
    if (nums[mid] < target) left = mid + 1
    else right = mid - 1
  }

  return -1
}`,
  'bubble-sort': `function bubbleSort(nums: number[]): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length - i - 1; j++) {
      if (nums[j] > nums[j + 1]) {
        const temp = nums[j]
        nums[j] = nums[j + 1]
        nums[j + 1] = temp
      }
    }
  }

  return nums
}`,
  'selection-sort': `function selectionSort(nums: number[]): number[] {
  for (let i = 0; i < nums.length; i++) {
    let minIndex = i

    for (let j = i + 1; j < nums.length; j++) {
      if (nums[j] < nums[minIndex]) {
        minIndex = j
      }
    }

    const temp = nums[i]
    nums[i] = nums[minIndex]
    nums[minIndex] = temp
  }

  return nums
}`,
  'insertion-sort': `function insertionSort(nums: number[]): number[] {
  for (let i = 1; i < nums.length; i++) {
    const current = nums[i]
    let j = i - 1

    while (j >= 0 && nums[j] > current) {
      nums[j + 1] = nums[j]
      j--
    }

    nums[j + 1] = current
  }

  return nums
}`,
  'merge-sort': `function mergeSort(nums: number[]): number[] {
  const merge = (left: number, mid: number, right: number): void => {
    const leftPart = nums.slice(left, mid + 1)
    const rightPart = nums.slice(mid + 1, right + 1)
    let i = 0
    let j = 0
    let k = left

    while (i < leftPart.length && j < rightPart.length) {
      if (leftPart[i] <= rightPart[j]) {
        nums[k] = leftPart[i]
        i++
      } else {
        nums[k] = rightPart[j]
        j++
      }
      k++
    }

    while (i < leftPart.length) {
      nums[k] = leftPart[i]
      i++
      k++
    }

    while (j < rightPart.length) {
      nums[k] = rightPart[j]
      j++
      k++
    }
  }

  const sort = (left: number, right: number): void => {
    if (left >= right) return

    const mid = Math.floor((left + right) / 2)
    sort(left, mid)
    sort(mid + 1, right)
    merge(left, mid, right)
  }

  sort(0, nums.length - 1)
  return nums
}`,
  'quick-sort': `function quickSort(nums: number[]): number[] {
  const partition = (left: number, right: number): number => {
    const pivot = nums[right]
    let storeIndex = left

    for (let i = left; i < right; i++) {
      if (nums[i] <= pivot) {
        const temp = nums[i]
        nums[i] = nums[storeIndex]
        nums[storeIndex] = temp
        storeIndex++
      }
    }

    const temp = nums[storeIndex]
    nums[storeIndex] = nums[right]
    nums[right] = temp

    return storeIndex
  }

  const sort = (left: number, right: number): void => {
    if (left >= right) return

    const pivotIndex = partition(left, right)
    sort(left, pivotIndex - 1)
    sort(pivotIndex + 1, right)
  }

  sort(0, nums.length - 1)
  return nums
}`,
  'heap-sort': `function heapSort(nums: number[]): number[] {
  const heapify = (size: number, root: number): void => {
    let largest = root
    const left = root * 2 + 1
    const right = root * 2 + 2

    if (left < size && nums[left] > nums[largest]) {
      largest = left
    }

    if (right < size && nums[right] > nums[largest]) {
      largest = right
    }

    if (largest !== root) {
      const temp = nums[root]
      nums[root] = nums[largest]
      nums[largest] = temp

      heapify(size, largest)
    }
  }

  for (let i = Math.floor(nums.length / 2) - 1; i >= 0; i--) {
    heapify(nums.length, i)
  }

  for (let end = nums.length - 1; end > 0; end--) {
    const temp = nums[0]
    nums[0] = nums[end]
    nums[end] = temp

    heapify(end, 0)
  }

  return nums
}`,
  'valid-anagram': `function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false

  const counts = new Map<string, number>()

  for (const char of s) {
    counts.set(char, (counts.get(char) ?? 0) + 1)
  }

  for (const char of t) {
    const next = (counts.get(char) ?? 0) - 1
    if (next < 0) return false
    counts.set(char, next)
  }

  return true
}`,
  'group-anagrams': `function groupAnagrams(strs: string[]): string[][] {
  const groups = new Map<string, string[]>()

  for (const word of strs) {
    const key = word.split('').sort().join('')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(word)
  }

  return Array.from(groups.values())
}`,
  'top-k-frequent': `function topKFrequent(nums: number[], k: number): number[] {
  const counts = new Map<number, number>()
  for (const num of nums) {
    counts.set(num, (counts.get(num) ?? 0) + 1)
  }

  const buckets: number[][] = Array.from(
    { length: nums.length + 1 },
    () => []
  )

  for (const [num, count] of counts) {
    buckets[count].push(num)
  }

  const result: number[] = []
  for (let count = buckets.length - 1; count >= 0 && result.length < k; count--) {
    for (const num of buckets[count]) {
      result.push(num)
      if (result.length === k) break
    }
  }

  return result
}`,
  'valid-parentheses': `function isValid(s: string): boolean {
  const pairs = new Map<string, string>([
    [')', '('],
    [']', '['],
    ['}', '{'],
  ])
  const stack: string[] = []

  for (const char of s) {
    if (char === '(' || char === '[' || char === '{') {
      stack.push(char)
      continue
    }

    if (stack.pop() !== pairs.get(char)) return false
  }

  return stack.length === 0
}`,
  'search-rotated-array': `function search(nums: number[], target: number): number {
  let left = 0
  let right = nums.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    if (nums[mid] === target) return mid

    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1
      } else {
        left = mid + 1
      }
    } else {
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }
  }

  return -1
}`,
  'product-except-self': `function productExceptSelf(nums: number[]): number[] {
  const answer: number[] = new Array(nums.length)

  let prefix = 1
  for (let i = 0; i < nums.length; i++) {
    answer[i] = prefix
    prefix *= nums[i]
  }

  let suffix = 1
  for (let i = nums.length - 1; i >= 0; i--) {
    answer[i] *= suffix
    suffix *= nums[i]
  }

  return answer
}`,
  'trapping-rain-water': `function trap(height: number[]): number {
  let left = 0
  let right = height.length - 1
  let leftMax = 0
  let rightMax = 0
  let water = 0

  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left])
      water += leftMax - height[left]
      left++
    } else {
      rightMax = Math.max(rightMax, height[right])
      water += rightMax - height[right]
      right--
    }
  }

  return water
}`,
  'container-with-most-water': `function maxArea(height: number[]): number {
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
}`,
  'daily-temperatures': `function dailyTemperatures(temperatures: number[]): number[] {
  const result: number[] = new Array(temperatures.length).fill(0)
  const stack: number[] = []

  for (let i = 0; i < temperatures.length; i++) {
    while (
      stack.length > 0 &&
      temperatures[i] > temperatures[stack[stack.length - 1]]
    ) {
      const prev = stack.pop()!
      result[prev] = i - prev
    }

    stack.push(i)
  }

  return result
}`,
  'word-break': `function wordBreak(s: string, wordDict: string[]): boolean {
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
}`,
  'coin-change': `function coinChange(coins: number[], amount: number): number {
  const dp = Array(amount + 1).fill(amount + 1)
  dp[0] = 0

  for (const coin of coins) {
    for (let x = coin; x <= amount; x++) {
      dp[x] = Math.min(dp[x], dp[x - coin] + 1)
    }
  }

  return dp[amount] > amount ? -1 : dp[amount]
}`,
  'longest-increasing-subsequence': `function lengthOfLIS(nums: number[]): number {
  if (nums.length === 0) return 0

  const dp = new Array<number>(nums.length).fill(1)

  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1)
      }
    }
  }

  return Math.max(...dp)
}`,
  'house-robber': `function rob(nums: number[]): number {
  if (nums.length === 0) return 0
  if (nums.length === 1) return nums[0]

  let prev2 = nums[0]
  let prev1 = Math.max(nums[0], nums[1])

  for (let i = 2; i < nums.length; i++) {
    const current = Math.max(prev1, prev2 + nums[i])
    prev2 = prev1
    prev1 = current
  }

  return prev1
}`,
  subsets: `function subsets(nums: number[]): number[][] {
  const result: number[][] = []
  const path: number[] = []

  function dfs(startIndex: number): void {
    result.push([...path])

    for (let i = startIndex; i < nums.length; i++) {
      path.push(nums[i])
      dfs(i + 1)
      path.pop()
    }
  }

  dfs(0)
  return result
}`,
  'number-of-islands': `function numIslands(grid: string[][]): number {
  let islands = 0

  const visit = (row: number, col: number): void => {
    if (row < 0 || col < 0) return
    if (row >= grid.length || col >= grid[row].length) return
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
        islands++
        visit(row, col)
      }
    }
  }

  return islands
}`,
  'flood-fill': `function floodFill(
  image: number[][],
  sr: number,
  sc: number,
  color: number
): number[][] {
  const original = image[sr][sc]
  if (original === color) return image

  const fill = (row: number, col: number): void => {
    if (row < 0 || col < 0) return
    if (row >= image.length || col >= image[row].length) return
    if (image[row][col] !== original) return

    image[row][col] = color
    fill(row + 1, col)
    fill(row - 1, col)
    fill(row, col + 1)
    fill(row, col - 1)
  }

  fill(sr, sc)
  return image
}`,
  'rotate-image': `function rotate(matrix: number[][]): void {
  const n = matrix.length

  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      const temp = matrix[r][c]
      matrix[r][c] = matrix[c][r]
      matrix[c][r] = temp
    }
  }

  for (let r = 0; r < n; r++) {
    matrix[r].reverse()
  }
}`,
  'set-matrix-zeroes': `function setZeroes(matrix: number[][]): void {
  const m = matrix.length
  const n = matrix[0].length
  let firstRowHasZero = false
  let firstColHasZero = false

  for (let c = 0; c < n; c++) {
    if (matrix[0][c] === 0) firstRowHasZero = true
  }

  for (let r = 0; r < m; r++) {
    if (matrix[r][0] === 0) firstColHasZero = true
  }

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0
        matrix[0][c] = 0
      }
    }
  }

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0
      }
    }
  }

  if (firstRowHasZero) {
    for (let c = 0; c < n; c++) matrix[0][c] = 0
  }

  if (firstColHasZero) {
    for (let r = 0; r < m; r++) matrix[r][0] = 0
  }
}`,
  'spiral-matrix': `function spiralOrder(matrix: number[][]): number[] {
  const result: number[] = []
  let top = 0
  let bottom = matrix.length - 1
  let left = 0
  let right = matrix[0].length - 1

  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col++) {
      result.push(matrix[top][col])
    }
    top++

    for (let row = top; row <= bottom; row++) {
      result.push(matrix[row][right])
    }
    right--

    if (top <= bottom) {
      for (let col = right; col >= left; col--) {
        result.push(matrix[bottom][col])
      }
      bottom--
    }

    if (left <= right) {
      for (let row = bottom; row >= top; row--) {
        result.push(matrix[row][left])
      }
      left++
    }
  }

  return result
}`,
  'max-area-of-island': `function maxAreaOfIsland(grid: number[][]): number {
  let best = 0
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]

  function visit(row: number, col: number): number {
    if (row < 0 || col < 0) return 0
    if (row >= grid.length || col >= grid[row].length) return 0
    if (grid[row][col] !== 1) return 0

    grid[row][col] = 0
    let area = 1

    for (const [dr, dc] of directions) {
      area += visit(row + dr, col + dc)
    }

    return area
  }

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      best = Math.max(best, visit(row, col))
    }
  }

  return best
}`,
  'course-schedule': `function canFinish(
  numCourses: number,
  prerequisites: number[][]
): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => [])
  const indegree: number[] = Array(numCourses).fill(0)

  for (const [course, prerequisite] of prerequisites) {
    graph[prerequisite].push(course)
    indegree[course]++
  }

  const queue: number[] = []
  for (let course = 0; course < numCourses; course++) {
    if (indegree[course] === 0) queue.push(course)
  }

  let completed = 0
  for (let head = 0; head < queue.length; head++) {
    const course = queue[head]
    completed++

    for (const next of graph[course]) {
      indegree[next]--
      if (indegree[next] === 0) queue.push(next)
    }
  }

  return completed === numCourses
}`,
  'clone-graph': `function cloneGraph(node: _Node | null): _Node | null {
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
  'tree-depth': `function maxDepth(root: TreeNode | null): number {
  if (root === null) return 0

  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1
}`,
  'invert-binary-tree': `function invertTree(root: TreeNode | null): TreeNode | null {
  if (root === null) return null

  const left = invertTree(root.left)
  const right = invertTree(root.right)
  root.left = right
  root.right = left

  return root
}`,
  'lowest-common-ancestor': `function lowestCommonAncestor(
  root: TreeNode | null,
  p: TreeNode | null,
  q: TreeNode | null
): TreeNode | null {
  if (root === null || root === p || root === q) return root

  const left = lowestCommonAncestor(root.left, p, q)
  const right = lowestCommonAncestor(root.right, p, q)

  if (left !== null && right !== null) return root

  return left ?? right
}`,
  'build-tree': `function buildTree(
  preorder: number[],
  inorder: number[]
): TreeNode | null {
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
  ): TreeNode | null {
    if (preStart > preEnd || inStart > inEnd) return null

    const rootVal = preorder[preStart]
    const root = new TreeNode(rootVal)
    const rootIndex = indexMap.get(rootVal)!
    const leftSize = rootIndex - inStart

    root.left = build(preStart + 1, preStart + leftSize, inStart, rootIndex - 1)
    root.right = build(preStart + leftSize + 1, preEnd, rootIndex + 1, inEnd)

    return root
  }

  return build(0, preorder.length - 1, 0, inorder.length - 1)
}`,
  'binary-tree-level-order': `function levelOrder(root: TreeNode | null): number[][] {
  if (root === null) return []

  const result: number[][] = []
  const queue: TreeNode[] = [root]

  while (queue.length > 0) {
    const levelSize = queue.length
    const level: number[] = []

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!
      level.push(node.val)

      if (node.left !== null) queue.push(node.left)
      if (node.right !== null) queue.push(node.right)
    }

    result.push(level)
  }

  return result
}`,
  'path-sum': `function hasPathSum(
  root: TreeNode | null,
  targetSum: number
): boolean {
  if (root === null) return false

  const remain = targetSum - root.val

  if (root.left === null && root.right === null) {
    return remain === 0
  }

  return hasPathSum(root.left, remain) || hasPathSum(root.right, remain)
}`,
  'reverse-list': `function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null
  let current = head

  while (current !== null) {
    const next = current.next
    current.next = prev
    prev = current
    current = next
  }

  return prev
}`,
  'merge-two-lists': `function mergeTwoLists(
  list1: ListNode | null,
  list2: ListNode | null
): ListNode | null {
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
}`,
  'remove-nth-from-end': `function removeNthFromEnd(
  head: ListNode | null,
  n: number
): ListNode | null {
  const dummy = new ListNode(0, head)
  let fast: ListNode | null = dummy
  let slow: ListNode | null = dummy

  for (let i = 0; i < n + 1; i++) {
    fast = fast!.next
  }

  while (fast !== null) {
    fast = fast.next
    slow = slow!.next
  }

  slow!.next = slow!.next!.next

  return dummy.next
}`,
} as const

export type AlgorithmExampleSourceId = keyof typeof ALGORITHM_EXAMPLE_SOURCES
