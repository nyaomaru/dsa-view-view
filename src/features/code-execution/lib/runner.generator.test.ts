import { describe, expect, it } from 'vite-plus/test'

import { YIELD_INPUT_LABEL, YIELD_VALUE_LABEL } from '@/entities/execution'
import { stepBackward, stepForward } from './execution-state'
import { executeCode, executeCodeAsync } from './runner'
import { getCallFrameInspectorState } from '@/features/visualization/lib/call-frame-inspector'

describe('runner - generator execution', () => {
  it('drives a generator entry through multiple yields and its final return', () => {
    const state = executeCode(
      `function* count(start: number): Generator<number, string, void> {
  let current = start
  yield current
  current += 1
  yield current
  return \`done:${'${current}'}\`
}`,
      { start: 1 },
      'count'
    )
    const yieldSteps = state.steps.filter((step) =>
      step.type.startsWith('yield-')
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('done:2')
    expect(yieldSteps.map((step) => step.type)).toEqual([
      'yield-suspend',
      'yield-resume',
      'yield-suspend',
      'yield-resume',
    ])
    expect(
      yieldSteps
        .filter((step) => step.type === 'yield-suspend')
        .map((step) => step.variables[YIELD_VALUE_LABEL])
    ).toEqual([1, 2])
    expect(
      yieldSteps
        .filter((step) => step.type === 'yield-resume')
        .map((step) => step.variables[YIELD_INPUT_LABEL])
    ).toEqual([undefined, undefined])
  })

  it('evaluates synchronous yield operand work before suspension', () => {
    const state = executeCode(
      `function helper(): number {
  const value = 3
  return value
}

function* values(): Generator<number, void, void> {
  yield helper()
}`,
      {},
      'values'
    )
    const helperReturnIndex = state.steps.findIndex(
      (step) =>
        step.type === 'return' &&
        step.metadata?.callFrame?.functionName === 'helper'
    )
    const suspendIndex = state.steps.findIndex(
      (step) => step.type === 'yield-suspend'
    )

    expect(helperReturnIndex).toBeGreaterThan(-1)
    expect(suspendIndex).toBeGreaterThan(helperReturnIndex)
  })

  it('feeds next(value) back into a manually consumed generator', () => {
    const state = executeCode(
      `function* exchange(): Generator<number, number, number> {
  const received = yield 4
  return received * 2
}

function run(): number[] {
  const iterator = exchange()
  const first = iterator.next()
  const second = iterator.next(5)
  return [first.value as number, second.value as number]
}`,
      {},
      'run'
    )
    const resume = state.steps.find((step) => step.type === 'yield-resume')

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([4, 10])
    expect(resume?.variables[YIELD_INPUT_LABEL]).toBe(5)
    expect(
      state.steps.some(
        (step) =>
          step.type === 'variable-declaration' && step.variables.received === 5
      )
    ).toBe(true)
  })

  it('closes the correct frame after iterator.return and runs cleanup first', () => {
    const state = executeCode(
      `function* values(log: string[]): Generator<number, number, void> {
  try {
    yield 1
    log.push('after')
  } finally {
    log.push('cleanup')
  }
  return 0
}

function run(): string[] {
  const log: string[] = []
  const iterator = values(log)
  iterator.next()
  const closed = iterator.return(9)
  log.push(\`done:${'${closed.value}'}\`)
  return log
}`,
      {},
      'run'
    )
    const generatorEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'values'
    )
    const close = state.steps.find((step) => step.type === 'generator-close')
    const cleanupIndex = state.steps.findIndex((step) =>
      step.description.startsWith("log.push('cleanup')")
    )
    const closeIndex = state.steps.findIndex(
      (step) => step.type === 'generator-close'
    )
    const atClose = getCallFrameInspectorState({
      ...state,
      currentStep: closeIndex,
    })
    const afterClose = getCallFrameInspectorState({
      ...state,
      currentStep: closeIndex + 1,
    })
    const generatorFrameId = generatorEntry?.metadata?.callFrame?.frameId

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['cleanup', 'done:9'])
    expect(close?.metadata?.callFrame).toEqual(
      expect.objectContaining({
        frameId: generatorEntry?.metadata?.callFrame?.frameId,
        phase: 'close',
      })
    )
    expect(closeIndex).toBeGreaterThan(cleanupIndex)
    expect(
      atClose.frames.find((frame) => frame.id === generatorFrameId)?.status
    ).toBe('closing')
    expect(
      afterClose.frames.find((frame) => frame.id === generatorFrameId)?.status
    ).toBe('completed')
  })

  it('reactivates the same frame when iterator.throw is handled', () => {
    const state = executeCode(
      `function* recover(): Generator<number | string, string, void> {
  try {
    yield 1
  } catch (error) {
    const message = (error as Error).message
    yield message
  }
  return 'done'
}

function run(): unknown[] {
  const iterator = recover()
  iterator.next()
  const recovered = iterator.throw(new Error('boom'))
  const completed = iterator.next()
  return [recovered.value, completed.value]
}`,
      {},
      'run'
    )
    const generatorFrameIds = state.steps
      .filter(
        (step) =>
          step.metadata?.callFrame?.functionName === 'recover' &&
          step.type.startsWith('yield-')
      )
      .map((step) => step.metadata?.callFrame?.frameId)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['boom', 'done'])
    expect(state.steps.some((step) => step.type === 'yield-throw')).toBe(true)
    expect(new Set(generatorFrameIds).size).toBe(1)
  })

  it('keeps repeated manually consumed generator frames independent', () => {
    const state = executeCode(
      `function* child(label: string): Generator<string, string, void> {
  yield label
  return \`${'${label}'}!\`
}

function run(): unknown[] {
  const first = child('first')
  const second = child('second')
  const values = [
    first.next().value,
    second.next().value,
    second.next().value,
    first.next().value,
  ]
  return values
}`,
      {},
      'run'
    )
    const entries = state.steps.filter(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'child'
    )
    const returns = state.steps.filter(
      (step) =>
        step.type === 'return' &&
        step.metadata?.callFrame?.functionName === 'child'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['first', 'second', 'second!', 'first!'])
    expect(entries).toHaveLength(2)
    expect(entries[0]?.metadata?.callFrame?.frameId).not.toBe(
      entries[1]?.metadata?.callFrame?.frameId
    )
    expect(returns.map((step) => step.metadata?.callFrame?.frameId)).toEqual([
      entries[1]?.metadata?.callFrame?.frameId,
      entries[0]?.metadata?.callFrame?.frameId,
    ])
  })

  it('traces values delegated with yield*', () => {
    const state = executeCode(
      `function* values(): Generator<number, number, void> {
  yield* [1, 2]
  return 3
}`,
      {},
      'values'
    )
    const yieldedValues = state.steps
      .filter((step) => step.type === 'yield-suspend')
      .map((step) => step.variables[YIELD_VALUE_LABEL])

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)
    expect(yieldedValues).toEqual([1, 2])
  })

  it('calls a delegated iterator first with no argument', () => {
    const state = executeCode(
      `function* values(counts: number[]): Generator<string, string, string> {
  const delegated = {
    [Symbol.iterator](): Iterator<string, string, string> {
      let started = false
      return {
        next(value?: string): IteratorResult<string, string> {
          counts.push(arguments.length)
          if (!started) {
            started = true
            return {
              done: false,
              value: arguments.length === 0 ? 'first' : 'unexpected',
            }
          }
          return { done: true, value: value ?? 'missing' }
        },
      }
    },
  }
  return yield* delegated
}

function run(): unknown[] {
  const counts: number[] = []
  const iterator = values(counts)
  const first = iterator.next()
  const second = iterator.next('resume')
  return [counts, first.value, second.value]
}`,
      {},
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([[0, 1], 'first', 'resume'])
  })

  it('keeps nested yield* frames and parent relationships separate', () => {
    const state = executeCode(
      `function* child(): Generator<number, string, void> {
  yield 1
  return 'child done'
}

function* parent(): Generator<number | string, string, void> {
  const childResult = yield* child()
  yield childResult
  return 'parent done'
}`,
      {},
      'parent'
    )
    const parentEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'parent'
    )
    const childEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'child'
    )
    const childFrameId = childEntry?.metadata?.callFrame?.frameId
    const childSteps = state.steps.filter(
      (step) => step.metadata?.callFrame?.frameId === childFrameId
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('parent done')
    expect(childEntry?.metadata?.callFrame?.parentFrameId).toBe(
      parentEntry?.metadata?.callFrame?.frameId
    )
    expect(
      childSteps.every(
        (step) => step.metadata?.callFrame?.functionName === 'child'
      )
    ).toBe(true)
    expect(
      state.steps
        .filter(
          (step) =>
            step.type === 'yield-suspend' &&
            step.metadata?.callFrame?.functionName === 'parent'
        )
        .map((step) => step.variables[YIELD_VALUE_LABEL])
    ).toEqual([1, 'child done'])
  })

  it('rewinds and resumes across a yield boundary', () => {
    const state = executeCode(
      `function* value(): Generator<number, void, void> {
  yield 7
}`,
      {},
      'value'
    )
    const resumeIndex = state.steps.findIndex(
      (step) => step.type === 'yield-resume'
    )
    const atResume = { ...state, currentStep: resumeIndex }
    const atSuspend = stepBackward(atResume)

    expect(atSuspend.steps[atSuspend.currentStep]?.type).toBe('yield-suspend')
    expect(
      atSuspend.steps[atSuspend.currentStep]?.variables[YIELD_VALUE_LABEL]
    ).toBe(7)
    expect(stepForward(atSuspend).currentStep).toBe(resumeIndex)
  })

  it('reconstructs a suspended generator frame at a yield step', () => {
    const state = executeCode(
      `function* value(): Generator<number, void, void> {
  const local = 7
  yield local
}`,
      {},
      'value'
    )
    const suspendIndex = state.steps.findIndex(
      (step) => step.type === 'yield-suspend'
    )
    const inspector = getCallFrameInspectorState({
      ...state,
      currentStep: suspendIndex,
    })
    const frame = inspector.frames.find(
      (candidate) => candidate.functionName === 'value'
    )

    expect(inspector.currentFrameId).toBeUndefined()
    expect(frame).toEqual(
      expect.objectContaining({
        status: 'suspended',
        visibleVariableNames: expect.arrayContaining(['local']),
      })
    )
  })

  it('drives a synchronous generator through the async execution path', async () => {
    const state = await executeCodeAsync(
      `function* answer(): Generator<number, number, void> {
  yield 1
  return 42
}`,
      {},
      'answer'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(42)
  })
})
