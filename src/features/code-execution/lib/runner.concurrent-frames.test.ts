import { describe, expect, it } from 'vite-plus/test'

import {
  FUNCTION_ARGUMENTS_LABEL,
  type ExecutionState,
  type ExecutionStep,
} from '@/entities/execution'
import { executeCodeAsync } from './runner'

function getFrameEntries(
  state: ExecutionState,
  functionName: string
): ExecutionStep[] {
  return state.steps.filter(
    (step) =>
      step.metadata?.callFrame?.phase === 'enter' &&
      step.metadata.callFrame.functionName === functionName
  )
}

function getFrameSteps(
  state: ExecutionState,
  frameId: number | undefined
): ExecutionStep[] {
  return state.steps.filter(
    (step) => step.metadata?.callFrame?.frameId === frameId
  )
}

describe('runner - concurrent call frames', () => {
  it('attributes out-of-order Promise.all completion to each branch', async () => {
    const state = await executeCodeAsync(
      `async function fast(): Promise<string> {
  const before = 'fast:before'
  await Promise.resolve()
  const after = 'fast:after'
  return after
}

async function slow(): Promise<string> {
  const before = 'slow:before'
  await Promise.resolve()
  await Promise.resolve()
  const after = 'slow:after'
  return after
}

async function run(): Promise<string> {
  const results = await Promise.all([fast(), slow()])
  return results.join(',')
}`,
      {},
      'run'
    )
    const runEntry = getFrameEntries(state, 'run')[0]
    const fastEntry = getFrameEntries(state, 'fast')[0]
    const slowEntry = getFrameEntries(state, 'slow')[0]
    const runFrameId = runEntry?.metadata?.callFrame?.frameId
    const fastFrameId = fastEntry?.metadata?.callFrame?.frameId
    const slowFrameId = slowEntry?.metadata?.callFrame?.frameId
    const fastSteps = getFrameSteps(state, fastFrameId)
    const slowSteps = getFrameSteps(state, slowFrameId)
    const fastReturnIndex = state.steps.findIndex(
      (step) =>
        step.metadata?.callFrame?.frameId === fastFrameId &&
        step.metadata?.callFrame?.phase === 'return'
    )
    const slowReturnIndex = state.steps.findIndex(
      (step) =>
        step.metadata?.callFrame?.frameId === slowFrameId &&
        step.metadata?.callFrame?.phase === 'return'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('fast:after,slow:after')
    expect(fastEntry?.metadata?.callFrame?.parentFrameId).toBe(runFrameId)
    expect(slowEntry?.metadata?.callFrame?.parentFrameId).toBe(runFrameId)
    expect(fastReturnIndex).toBeGreaterThan(-1)
    expect(slowReturnIndex).toBeGreaterThan(fastReturnIndex)
    expect(
      fastSteps.map((step) => step.metadata?.callFrame?.functionName)
    ).toEqual(Array(fastSteps.length).fill('fast'))
    expect(
      slowSteps.map((step) => step.metadata?.callFrame?.functionName)
    ).toEqual(Array(slowSteps.length).fill('slow'))
    const fastActiveSteps = fastSteps.filter(
      (step) => step.metadata?.callFrame?.phase !== 'return'
    )
    expect(fastActiveSteps.map((step) => step.callStack)).toEqual(
      fastActiveSteps.map(() => ['root', 'run', 'fast'])
    )
  })

  it('assigns distinct IDs to concurrent invocations of the same function', async () => {
    const state = await executeCodeAsync(
      `async function task(label: string, waitAgain: boolean): Promise<string> {
  await Promise.resolve()
  if (waitAgain) await Promise.resolve()
  const result = label + ':done'
  return result
}

async function run(): Promise<string[]> {
  return await Promise.all([task('first', true), task('second', false)])
}`,
      {},
      'run'
    )
    const taskEntries = getFrameEntries(state, 'task')
    const taskFrameIds = taskEntries.map(
      (step) => step.metadata?.callFrame?.frameId
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['first:done', 'second:done'])
    expect(taskEntries).toHaveLength(2)
    expect(new Set(taskFrameIds).size).toBe(2)
    expect(
      taskEntries.map((step) => step.variables[FUNCTION_ARGUMENTS_LABEL])
    ).toEqual([
      { label: 'first', waitAgain: true },
      { label: 'second', waitAgain: false },
    ])

    for (const [index, frameId] of taskFrameIds.entries()) {
      const returnStep = getFrameSteps(state, frameId).find(
        (step) => step.metadata?.callFrame?.phase === 'return'
      )

      expect(returnStep?.variables.label).toBe(index === 0 ? 'first' : 'second')
    }

    const returnFrameIds = state.steps.flatMap((step) =>
      step.metadata?.callFrame?.phase === 'return' &&
      taskFrameIds.includes(step.metadata.callFrame.frameId)
        ? [step.metadata.callFrame.frameId]
        : []
    )
    expect(returnFrameIds).toEqual([taskFrameIds[1], taskFrameIds[0]])
  })

  it('preserves parent IDs through nested concurrent branches', async () => {
    const state = await executeCodeAsync(
      `async function leaf(label: string, waitAgain: boolean): Promise<string> {
  await Promise.resolve()
  if (waitAgain) await Promise.resolve()
  return label
}

async function branch(label: string, waitAgain: boolean): Promise<string> {
  return await leaf(label, waitAgain)
}

async function run(): Promise<string[]> {
  return await Promise.all([
    branch('left', false),
    branch('right', true),
  ])
}`,
      {},
      'run'
    )
    const branchEntries = getFrameEntries(state, 'branch')
    const leafEntries = getFrameEntries(state, 'leaf')
    const branchIdByLabel = new Map(
      branchEntries.map((step) => [
        (
          step.variables[FUNCTION_ARGUMENTS_LABEL] as {
            label: string
          }
        ).label,
        step.metadata?.callFrame?.frameId,
      ])
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['left', 'right'])
    expect(leafEntries).toHaveLength(2)

    for (const leafEntry of leafEntries) {
      const args = leafEntry.variables[FUNCTION_ARGUMENTS_LABEL] as {
        label: string
      }

      expect(leafEntry.metadata?.callFrame?.parentFrameId).toBe(
        branchIdByLabel.get(args.label)
      )
    }
  })

  it('completes a rejected branch without corrupting a sibling frame', async () => {
    const state = await executeCodeAsync(
      `async function rejectBranch(): Promise<void> {
  const before = 'reject:before'
  await Promise.reject(new Error('boom'))
}

async function completeBranch(): Promise<string> {
  await Promise.resolve()
  const after = 'complete:after'
  return after
}

async function run(): Promise<string> {
  const results = await Promise.allSettled([
    rejectBranch(),
    completeBranch(),
  ])
  return results.map((result) => result.status).join(',')
}`,
      {},
      'run'
    )
    const rejectedEntry = getFrameEntries(state, 'rejectBranch')[0]
    const completedEntry = getFrameEntries(state, 'completeBranch')[0]
    const rejectedFrameId = rejectedEntry?.metadata?.callFrame?.frameId
    const completedFrameId = completedEntry?.metadata?.callFrame?.frameId
    const throwStep = state.steps.find(
      (step) =>
        step.type === 'function-throw' &&
        step.metadata?.callFrame?.frameId === rejectedFrameId
    )
    const completedReturn = state.steps.find(
      (step) =>
        step.metadata?.callFrame?.frameId === completedFrameId &&
        step.metadata?.callFrame?.phase === 'return'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('rejected,fulfilled')
    expect(throwStep?.metadata?.callFrame).toEqual(
      expect.objectContaining({
        frameId: rejectedFrameId,
        functionName: 'rejectBranch',
        phase: 'throw',
      })
    )
    expect(completedReturn?.metadata?.callFrame).toEqual(
      expect.objectContaining({
        frameId: completedFrameId,
        functionName: 'completeBranch',
        phase: 'return',
      })
    )
    expect(completedReturn?.variables.after).toBe('complete:after')
  })
})
