import {
  ALGORITHM_EXAMPLE_SOURCES,
  type AlgorithmExampleSourceId,
} from './algorithm-example-sources'

export type AlgorithmExample = {
  id: string
  label: string
  category: string
  sourceCode: string
  defaultInputValues?: Record<string, unknown>
}

const EXAMPLE_CATEGORY_BY_ID = new Map<AlgorithmExampleSourceId, string>([
  ['two-sum', 'Hash Map'],
  ['valid-anagram', 'Hash Map'],
  ['group-anagrams', 'Hash Map'],
  ['top-k-frequent', 'Hash Map'],
  ['binary-search', 'Binary Search'],
  ['search-rotated-array', 'Binary Search'],
  ['product-except-self', 'Array'],
  ['bubble-sort', 'Sorting'],
  ['selection-sort', 'Sorting'],
  ['insertion-sort', 'Sorting'],
  ['merge-sort', 'Sorting'],
  ['quick-sort', 'Sorting'],
  ['heap-sort', 'Sorting'],
  ['valid-parentheses', 'Stack'],
  ['daily-temperatures', 'Stack'],
  ['trapping-rain-water', 'Two Pointers'],
  ['container-with-most-water', 'Two Pointers'],
  ['word-break', 'Dynamic Programming'],
  ['coin-change', 'Dynamic Programming'],
  ['longest-increasing-subsequence', 'Dynamic Programming'],
  ['house-robber', 'Dynamic Programming'],
  ['subsets', 'Backtracking'],
  ['number-of-islands', 'Matrix'],
  ['flood-fill', 'Matrix'],
  ['rotate-image', 'Matrix'],
  ['set-matrix-zeroes', 'Matrix'],
  ['spiral-matrix', 'Matrix'],
  ['max-area-of-island', 'Matrix'],
  ['course-schedule', 'Graph'],
  ['clone-graph', 'Graph'],
  ['tree-depth', 'Binary Tree'],
  ['invert-binary-tree', 'Binary Tree'],
  ['lowest-common-ancestor', 'Binary Tree'],
  ['build-tree', 'Binary Tree'],
  ['binary-tree-level-order', 'Binary Tree'],
  ['path-sum', 'Binary Tree'],
  ['reverse-list', 'Linked List'],
  ['merge-two-lists', 'Linked List'],
  ['remove-nth-from-end', 'Linked List'],
])

type AlgorithmExampleDefinition = Omit<
  AlgorithmExample,
  'category' | 'id' | 'sourceCode'
> & {
  id: AlgorithmExampleSourceId
  sourceCode: (typeof ALGORITHM_EXAMPLE_SOURCES)[AlgorithmExampleSourceId]
}

const ALGORITHM_EXAMPLE_DEFINITIONS: AlgorithmExampleDefinition[] = [
  {
    id: 'two-sum',
    label: 'Two Sum',
    defaultInputValues: {
      nums: '[2, 7, 11, 15]',
      target: 9,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['two-sum'],
  },
  {
    id: 'binary-search',
    label: 'Binary Search',
    defaultInputValues: {
      nums: '[1, 3, 5, 7, 9, 11]',
      target: 7,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['binary-search'],
  },
  {
    id: 'bubble-sort',
    label: 'Bubble Sort',
    defaultInputValues: {
      nums: '[5, 1, 4, 2, 8]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['bubble-sort'],
  },
  {
    id: 'selection-sort',
    label: 'Selection Sort',
    defaultInputValues: {
      nums: '[64, 25, 12, 22, 11]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['selection-sort'],
  },
  {
    id: 'insertion-sort',
    label: 'Insertion Sort',
    defaultInputValues: {
      nums: '[5, 2, 4, 6, 1, 3]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['insertion-sort'],
  },
  {
    id: 'merge-sort',
    label: 'Merge Sort',
    defaultInputValues: {
      nums: '[38, 27, 43, 3, 9, 82, 10]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['merge-sort'],
  },
  {
    id: 'quick-sort',
    label: 'Quick Sort',
    defaultInputValues: {
      nums: '[10, 7, 8, 9, 1, 5]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['quick-sort'],
  },
  {
    id: 'heap-sort',
    label: 'Heap Sort',
    defaultInputValues: {
      nums: '[12, 11, 13, 5, 6, 7]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['heap-sort'],
  },
  {
    id: 'valid-anagram',
    label: 'Valid Anagram',
    defaultInputValues: {
      s: 'anagram',
      t: 'nagaram',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['valid-anagram'],
  },
  {
    id: 'group-anagrams',
    label: 'Group Anagrams',
    defaultInputValues: {
      strs: '["eat", "tea", "tan", "ate", "nat", "bat"]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['group-anagrams'],
  },
  {
    id: 'top-k-frequent',
    label: 'Top K Frequent',
    defaultInputValues: {
      nums: '[1, 1, 1, 2, 2, 3]',
      k: 2,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['top-k-frequent'],
  },
  {
    id: 'valid-parentheses',
    label: 'Valid Parentheses',
    defaultInputValues: {
      s: '({[]})',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['valid-parentheses'],
  },
  {
    id: 'search-rotated-array',
    label: 'Search Rotated Array',
    defaultInputValues: {
      nums: '[4, 5, 6, 7, 0, 1, 2]',
      target: 0,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['search-rotated-array'],
  },
  {
    id: 'product-except-self',
    label: 'Product Except Self',
    defaultInputValues: {
      nums: '[1, 2, 3, 4]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['product-except-self'],
  },
  {
    id: 'trapping-rain-water',
    label: 'Trapping Rain Water',
    defaultInputValues: {
      height: '[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['trapping-rain-water'],
  },
  {
    id: 'container-with-most-water',
    label: 'Container With Most Water',
    defaultInputValues: {
      height: '[1, 8, 6, 2, 5, 4, 8, 3, 7]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['container-with-most-water'],
  },
  {
    id: 'daily-temperatures',
    label: 'Daily Temperatures',
    defaultInputValues: {
      temperatures: '[73, 74, 75, 71, 69, 72, 76, 73]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['daily-temperatures'],
  },
  {
    id: 'word-break',
    label: 'Word Break',
    defaultInputValues: {
      s: 'leetcode',
      wordDict: '["leet", "code"]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['word-break'],
  },
  {
    id: 'coin-change',
    label: 'Coin Change',
    defaultInputValues: {
      coins: '[1, 2, 5]',
      amount: 11,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['coin-change'],
  },
  {
    id: 'longest-increasing-subsequence',
    label: 'Longest Increasing Subsequence',
    defaultInputValues: {
      nums: '[10, 9, 2, 5, 3, 7, 101, 18]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['longest-increasing-subsequence'],
  },
  {
    id: 'house-robber',
    label: 'House Robber',
    defaultInputValues: {
      nums: '[2, 7, 9, 3, 1]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['house-robber'],
  },
  {
    id: 'subsets',
    label: 'Subsets',
    defaultInputValues: {
      nums: '[1, 2, 3]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['subsets'],
  },
  {
    id: 'number-of-islands',
    label: 'Number of Islands',
    defaultInputValues: {
      grid: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['number-of-islands'],
  },
  {
    id: 'flood-fill',
    label: 'Flood Fill',
    defaultInputValues: {
      image: '[[1,1,1],[1,1,0],[1,0,1]]',
      sr: 1,
      sc: 1,
      color: 2,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['flood-fill'],
  },
  {
    id: 'rotate-image',
    label: 'Rotate Image',
    defaultInputValues: {
      matrix: '[[1,2,3],[4,5,6],[7,8,9]]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['rotate-image'],
  },
  {
    id: 'set-matrix-zeroes',
    label: 'Set Matrix Zeroes',
    defaultInputValues: {
      matrix: '[[1,1,1],[1,0,1],[1,1,1]]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['set-matrix-zeroes'],
  },
  {
    id: 'spiral-matrix',
    label: 'Spiral Matrix',
    defaultInputValues: {
      matrix: '[[1,2,3],[4,5,6],[7,8,9]]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['spiral-matrix'],
  },
  {
    id: 'max-area-of-island',
    label: 'Max Area of Island',
    defaultInputValues: {
      grid: '[[0,0,1,0,0],[1,1,1,0,0],[0,1,0,0,1],[0,0,0,1,1]]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['max-area-of-island'],
  },
  {
    id: 'course-schedule',
    label: 'Course Schedule',
    defaultInputValues: {
      numCourses: 4,
      prerequisites: '[[1,0],[2,0],[3,1],[3,2]]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['course-schedule'],
  },
  {
    id: 'clone-graph',
    label: 'Clone Graph',
    defaultInputValues: {
      node: '[[2,4],[1,3],[2,4],[1,3]]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['clone-graph'],
  },
  {
    id: 'tree-depth',
    label: 'Tree Max Depth',
    defaultInputValues: {
      root: '[3, 9, 20, null, null, 15, 7]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['tree-depth'],
  },
  {
    id: 'invert-binary-tree',
    label: 'Invert Binary Tree',
    defaultInputValues: {
      root: '[4, 2, 7, 1, 3, 6, 9]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['invert-binary-tree'],
  },
  {
    id: 'lowest-common-ancestor',
    label: 'Lowest Common Ancestor',
    defaultInputValues: {
      root: '[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]',
      p: 5,
      q: 4,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['lowest-common-ancestor'],
  },
  {
    id: 'build-tree',
    label: 'Build Tree',
    defaultInputValues: {
      preorder: '[3, 9, 20, 15, 7]',
      inorder: '[9, 3, 15, 20, 7]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['build-tree'],
  },
  {
    id: 'binary-tree-level-order',
    label: 'Binary Tree Level Order',
    defaultInputValues: {
      root: '[3, 9, 20, null, null, 15, 7]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['binary-tree-level-order'],
  },
  {
    id: 'path-sum',
    label: 'Path Sum',
    defaultInputValues: {
      root: '[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]',
      targetSum: 22,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['path-sum'],
  },
  {
    id: 'reverse-list',
    label: 'Reverse Linked List',
    defaultInputValues: {
      head: '[1, 2, 3, 4, 5]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['reverse-list'],
  },
  {
    id: 'merge-two-lists',
    label: 'Merge Two Sorted Lists',
    defaultInputValues: {
      list1: '[1, 2, 4]',
      list2: '[1, 3, 4]',
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['merge-two-lists'],
  },
  {
    id: 'remove-nth-from-end',
    label: 'Remove Nth From End',
    defaultInputValues: {
      head: '[1, 2, 3, 4, 5]',
      n: 2,
    },
    sourceCode: ALGORITHM_EXAMPLE_SOURCES['remove-nth-from-end'],
  },
]

export const ALGORITHM_EXAMPLES: AlgorithmExample[] =
  ALGORITHM_EXAMPLE_DEFINITIONS.map((example) => ({
    ...example,
    category: EXAMPLE_CATEGORY_BY_ID.get(example.id) ?? 'Other',
  }))

export function getRandomExample(
  random: () => number = Math.random
): AlgorithmExample {
  const index = Math.min(
    ALGORITHM_EXAMPLES.length - 1,
    Math.floor(random() * ALGORITHM_EXAMPLES.length)
  )
  return ALGORITHM_EXAMPLES[index]
}
