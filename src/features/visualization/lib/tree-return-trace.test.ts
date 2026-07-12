import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from '@/features/code-execution/lib/runner'
import { buildTreeReturnTrace } from './tree-return-trace'

const code = `
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val: number, left: TreeNode | null, right: TreeNode | null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function isBalanced(root: TreeNode | null): boolean {
  function height(node: TreeNode | null): number {
    if (node === null) return 0;

    const left = height(node.left);
    if (left === -1) return -1;

    const right = height(node.right);
    if (right === -1) return -1;

    if (Math.abs(left - right) > 1) return -1;

    return Math.max(left, right) + 1;
  }

  return height(root) !== -1;
}
`

describe('buildTreeReturnTrace', () => {
  it('maps recursive TreeNode returns back onto the displayed tree', () => {
    const root = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    }
    const state = executeCode(code, { root }, 'isBalanced')
    const trace = buildTreeReturnTrace(
      { ...state, currentStep: state.steps.length - 1 },
      root
    )

    expect(trace.summaries.get('root')?.latestReturn).toBe('2')
    expect(trace.summaries.get('root.left')?.latestReturn).toBe('1')
    expect(trace.summaries.get('root.right')?.latestReturn).toBe('1')
    expect(
      trace.rows.some(
        (row) => row.treePath === undefined && row.returnValue === '0'
      )
    ).toBe(true)
  })

  it('summarizes TreeNode returns and keeps full return details separately', () => {
    const root = {
      val: 6,
      left: {
        val: 2,
        left: { val: 0, left: null, right: null },
        right: {
          val: 4,
          left: { val: 3, left: null, right: null },
          right: { val: 5, left: null, right: null },
        },
      },
      right: {
        val: 8,
        left: { val: 7, left: null, right: null },
        right: { val: 9, left: null, right: null },
      },
    }
    const lcaCode = `
function lowestCommonAncestor(root: TreeNode | null, p: TreeNode | null, q: TreeNode | null) {
  if (root === null) return null;
  if (p === null || q === null) return null;
  if (root === p || root === q) return root;

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  if (left !== null && right !== null) return root;

  return left !== null ? left : right;
}
`
    const state = executeCode(
      lcaCode,
      { root, p: root.left, q: root.left.right },
      'lowestCommonAncestor'
    )
    const trace = buildTreeReturnTrace(
      { ...state, currentStep: state.steps.length - 1 },
      root
    )
    const treeReturn = trace.rows.find(
      (row) => row.returnValue === 'TreeNode(2)'
    )

    expect(treeReturn?.returnDetail).toContain('"val":2')
    expect(trace.summaries.get('root.left')?.latestReturn).toBe('TreeNode(2)')
  })
})
