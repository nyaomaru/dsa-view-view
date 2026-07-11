import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from '@/features/code-execution/lib/runner'

import { TreeGraphVisualizer } from './tree-graph-visualizer'

const lowestCommonAncestorCode = `
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

describe('TreeGraphVisualizer', () => {
  it('hides node return labels when no return value is available', () => {
    render(
      <TreeGraphVisualizer
        data={root}
        name="root"
        state={{
          currentStep: 0,
          totalSteps: 1,
          isComplete: false,
          returnValue: root,
          steps: [
            {
              stepNumber: 0,
              type: 'function-call',
              line: 0,
              description: 'Function called with: {}',
              variables: {},
              timestamp: Date.now(),
              callStack: ['root'],
            },
          ],
        }}
      />
    )

    expect(screen.queryByText('return = -')).not.toBeInTheDocument()
  })

  it('keeps TreeNode return details collapsed until requested', () => {
    const state = executeCode(
      lowestCommonAncestorCode,
      { root, p: root.left, q: root.left.right },
      'lowestCommonAncestor'
    )

    render(
      <TreeGraphVisualizer
        data={root}
        name="root"
        state={{ ...state, currentStep: state.steps.length - 1 }}
      />
    )

    expect(screen.getAllByText('TreeNode(2)').length).toBeGreaterThan(0)
    expect(screen.queryByText(/"right":\{"val":4/)).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Show details' })[0])

    expect(screen.getByText(/"right":\{"val":4/)).toBeInTheDocument()
  })
})
