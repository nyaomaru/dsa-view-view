import { describe, expect, it } from 'vite-plus/test'

import { FUNCTION_ARGUMENTS_LABEL } from '@/entities/execution'
import { executeCode } from './runner'

describe('runner - recursive frame snapshots', () => {
  it('keeps DFS arguments and resumed locals isolated for each invocation', () => {
    const code = `
type TreeNode = {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
};

function solve(root: TreeNode | null): number {
  function dfs(node: TreeNode | null, depth: number): number {
    const frame = { label: node ? \`${'${node.val}'}@${'${depth}'}\` : \`null@${'${depth}'}\` };

    if (!node) return 0;

    const left = dfs(node.left, depth + 1);
    frame.label += ':resumed';
    const afterLeft = frame.label;
    const right = dfs(node.right, depth + 1);

    return node.val + left + right;
  }

  return dfs(root, 0);
}
`
    const root = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    }

    const state = executeCode(code, { root }, 'solve')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(6)

    const dfsEntries = state.steps.filter(
      (step) =>
        step.type === 'function-entry' &&
        step.description === 'Entering function: dfs'
    )

    expect(
      dfsEntries.map((step) => step.variables[FUNCTION_ARGUMENTS_LABEL])
    ).toEqual([
      { node: expect.objectContaining({ val: 1 }), depth: 0 },
      { node: expect.objectContaining({ val: 2 }), depth: 1 },
      { node: null, depth: 2 },
      { node: null, depth: 2 },
      { node: expect.objectContaining({ val: 3 }), depth: 1 },
      { node: null, depth: 2 },
      { node: null, depth: 2 },
    ])

    const solveFrameId = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'solve'
    )?.metadata?.callFrame?.frameId
    const dfsFrames = dfsEntries.map((step) => step.metadata?.callFrame)
    const dfsFrameIds = dfsFrames.map((frame) => frame?.frameId)

    expect(solveFrameId).toBeDefined()
    expect(new Set(dfsFrameIds).size).toBe(dfsEntries.length)
    expect(dfsFrames).toEqual([
      expect.objectContaining({
        parentFrameId: solveFrameId,
        functionName: 'dfs',
        phase: 'enter',
        visibleVariableNames: expect.arrayContaining([
          FUNCTION_ARGUMENTS_LABEL,
          'node',
          'depth',
        ]),
      }),
      expect.objectContaining({ parentFrameId: dfsFrameIds[0] }),
      expect.objectContaining({ parentFrameId: dfsFrameIds[1] }),
      expect.objectContaining({ parentFrameId: dfsFrameIds[1] }),
      expect.objectContaining({ parentFrameId: dfsFrameIds[0] }),
      expect.objectContaining({ parentFrameId: dfsFrameIds[4] }),
      expect.objectContaining({ parentFrameId: dfsFrameIds[4] }),
    ])

    const returnedDfsFrameIds = state.steps.flatMap((step) => {
      const frame = step.metadata?.callFrame
      return frame?.functionName === 'dfs' && frame.phase === 'return'
        ? [frame.frameId]
        : []
    })

    expect(new Set(returnedDfsFrameIds)).toEqual(new Set(dfsFrameIds))

    const resumedSteps = state.steps.filter(
      (step) =>
        step.type === 'variable-declaration' &&
        step.description.startsWith('const afterLeft =')
    )

    expect(
      resumedSteps.map((step) => ({
        afterLeft: step.variables.afterLeft,
        depth: step.variables.depth,
        callStack: step.callStack,
      }))
    ).toEqual([
      {
        afterLeft: '2@1:resumed',
        depth: 1,
        callStack: ['root', 'solve', 'dfs', 'dfs'],
      },
      {
        afterLeft: '1@0:resumed',
        depth: 0,
        callStack: ['root', 'solve', 'dfs'],
      },
      {
        afterLeft: '3@1:resumed',
        depth: 1,
        callStack: ['root', 'solve', 'dfs', 'dfs'],
      },
    ])

    const rootFrameDeclaration = state.steps.find(
      (step) =>
        step.type === 'variable-declaration' &&
        step.description.startsWith('const frame =') &&
        step.variables.depth === 0
    )

    expect(rootFrameDeclaration?.variables.frame).toEqual({ label: '1@0' })
  })
})
