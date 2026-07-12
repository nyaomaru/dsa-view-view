import { describe, expect, it } from 'vite-plus/test'
import { getTreeNodeReferenceOptions } from '@/entities/data-structure'
import { executeCode } from './runner'
import { convertInputValues } from './structured-inputs'
import type { FunctionParameter } from '@/entities/code'

type TestTreeNode = {
  val: number
  left: TestTreeNode | null
  right: TestTreeNode | null
}

describe('tree node inputs', () => {
  const parameters: FunctionParameter[] = [
    { name: 'root', type: 'tree-node', optional: false },
    { name: 'p', type: 'tree-node', optional: false },
    { name: 'q', type: 'tree-node', optional: false },
  ]

  it('builds a root tree and resolves p/q as references within the same tree', () => {
    const inputs = convertInputValues(parameters, {
      root: '[6,2,8,0,4,7,9,null,null,3,5]',
      p: '2',
      q: '8',
    }) as {
      root: TestTreeNode | null
      p: TestTreeNode | null
      q: TestTreeNode | null
    }

    expect(inputs.root?.val).toBe(6)
    expect(inputs.root?.left?.val).toBe(2)
    expect(inputs.root?.right?.val).toBe(8)
    expect(inputs.p).toBe(inputs.root?.left)
    expect(inputs.q).toBe(inputs.root?.right)
  })

  it('uses path-based reference options when tree values are duplicated', () => {
    const inputs = convertInputValues(parameters, {
      root: '[1,2,2,null,null,3,3]',
      p: 'path:L',
      q: 'path:R',
    }) as {
      root: TestTreeNode | null
      p: TestTreeNode | null
      q: TestTreeNode | null
    }

    expect(getTreeNodeReferenceOptions(inputs.root)).toEqual([
      { value: 'value:1', label: '1', path: 'root', isDuplicateValue: false },
      {
        value: 'path:L',
        label: '2 (path: L)',
        path: 'L',
        isDuplicateValue: true,
      },
      {
        value: 'path:R',
        label: '2 (path: R)',
        path: 'R',
        isDuplicateValue: true,
      },
      {
        value: 'path:RL',
        label: '3 (path: RL)',
        path: 'RL',
        isDuplicateValue: true,
      },
      {
        value: 'path:RR',
        label: '3 (path: RR)',
        path: 'RR',
        isDuplicateValue: true,
      },
    ])
    expect(inputs.p).toBe(inputs.root?.left)
    expect(inputs.q).toBe(inputs.root?.right)
  })

  it('executes lowestCommonAncestor without accessing undefined children', () => {
    const code = `
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }
}

function lowestCommonAncestor(root: TreeNode | null, p: TreeNode | null, q: TreeNode | null): TreeNode | null {
  if (root === null) return null;
  if (p === null || q === null) return null;
  if (root === p || root === q) return root;

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  if (left !== null && right !== null) return root;

  return left !== null ? left : right;
}
`

    const inputs = convertInputValues(parameters, {
      root: '6,2,8,0,4,7,9,null,null,3,5',
      p: '2',
      q: '8',
    })

    const state = executeCode(code, inputs, 'lowestCommonAncestor')

    expect(state.error).toBeUndefined()
    expect((state.returnValue as { val?: number } | undefined)?.val).toBe(6)
  })
})
