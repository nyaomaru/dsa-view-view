import { oneOfValues } from '@/shared/lib/guards'

/** Recognizes built-in DSA class names that usually act as solution helpers. */
export const isPreparedTypeScriptClassName = oneOfValues(
  'TreeNode',
  'ListNode',
  'TrieNode',
  '_Node',
  'GraphNode',
  'NaryNode',
  'RandomListNode',
  'DoublyListNode',
  'Node',
  'PriorityQueue',
  'MinHeap',
  'MaxHeap',
  'Deque',
  'UnionFind',
  'DSU',
  'Counter'
)
