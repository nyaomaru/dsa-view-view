import { describe, expect, it } from 'vite-plus/test'

import { FUNCTION_ARGUMENTS_LABEL } from '@/entities/execution'
import { executeCode } from './runner'

describe('runner - recursive frame snapshots', () => {
  it('tracks object-method returns without completing the caller frame', () => {
    const code = `
function solve(): number {
  const helper = {
    getValue() {
      const value = 1;
      return value;
    },
  };
  const result = helper.getValue();
  const after = result + 1;
  return after;
}
`

    const state = executeCode(code, {}, 'solve')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)

    const solveEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'solve'
    )
    const methodEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'getValue'
    )
    const methodReturn = state.steps.find(
      (step) =>
        step.type === 'return' &&
        step.metadata?.callFrame?.functionName === 'getValue'
    )

    expect(methodEntry?.metadata?.callFrame).toEqual(
      expect.objectContaining({
        parentFrameId: solveEntry?.metadata?.callFrame?.frameId,
        phase: 'enter',
      })
    )
    expect(methodReturn?.metadata?.callFrame).toEqual(
      expect.objectContaining({
        frameId: methodEntry?.metadata?.callFrame?.frameId,
        phase: 'return',
      })
    )

    const callerStepsAfterMethod = state.steps.filter(
      (step) =>
        step.type === 'variable-declaration' &&
        (step.description.startsWith('const result =') ||
          step.description.startsWith('const after ='))
    )

    expect(
      callerStepsAfterMethod.map((step) => step.metadata?.callFrame?.frameId)
    ).toEqual([
      solveEntry?.metadata?.callFrame?.frameId,
      solveEntry?.metadata?.callFrame?.frameId,
    ])
  })

  it('unwinds recursive frames when helpers return by falling through', () => {
    const code = `
function solve(depth: number): number[] {
  const visits: number[] = [];

  function dfs(current: number): void {
    if (current > 0) dfs(current - 1);
    const total = current * 2;
    visits.push(total);
  }

  dfs(depth);
  visits.push(99);
  return visits;
}
`

    const state = executeCode(code, { depth: 2 }, 'solve')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([0, 2, 4, 99])

    const dfsEntries = state.steps.filter(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'dfs'
    )
    const dfsFrameIds = dfsEntries.map(
      (step) => step.metadata?.callFrame?.frameId
    )
    const dfsReturns = state.steps.filter(
      (step) =>
        step.type === 'return' &&
        step.metadata?.callFrame?.functionName === 'dfs'
    )

    expect(dfsReturns).toHaveLength(dfsEntries.length)
    expect(dfsReturns.map((step) => step.metadata?.callFrame?.frameId)).toEqual(
      [...dfsFrameIds].reverse()
    )
    expect(
      dfsReturns.every((step) => step.metadata?.callFrame?.phase === 'return')
    ).toBe(true)
    expect(
      dfsReturns.map((step) => ({
        current: step.variables.current,
        total: step.variables.total,
        visibleVariableNames: step.metadata?.callFrame?.visibleVariableNames,
      }))
    ).toEqual([
      {
        current: 0,
        total: 0,
        visibleVariableNames: expect.arrayContaining(['current', 'total']),
      },
      {
        current: 1,
        total: 2,
        visibleVariableNames: expect.arrayContaining(['current', 'total']),
      },
      {
        current: 2,
        total: 4,
        visibleVariableNames: expect.arrayContaining(['current', 'total']),
      },
    ])

    const mutationFrames = state.steps
      .filter((step) => step.description.startsWith('visits.push('))
      .map((step) => step.metadata?.callFrame)

    expect(mutationFrames.map((frame) => frame?.frameId)).toEqual([
      dfsFrameIds[2],
      dfsFrameIds[1],
      dfsFrameIds[0],
      dfsEntries[0]?.metadata?.callFrame?.parentFrameId,
    ])
  })

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
