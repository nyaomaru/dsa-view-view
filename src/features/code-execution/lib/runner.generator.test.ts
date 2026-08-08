import { describe, expect, it } from 'vite-plus/test'

import {
  RETURN_VALUE_LABEL,
  YIELD_INPUT_LABEL,
  YIELD_VALUE_LABEL,
} from '@/entities/execution'
import { stepBackward, stepForward } from './execution-state'
import { executeCode, executeCodeAsync } from './runner'
import { getCallFrameInspectorState } from '@/features/visualization/lib/call-frame-inspector'

describe('runner - generator execution', () => {
  it('preserves iterators returned by non-generator entries', async () => {
    const code = `function values(): IterableIterator<number> {
  return [1, 2].values()
}`
    const states = [
      executeCode(code, {}, 'values'),
      await executeCodeAsync(code, {}, 'values'),
    ]

    for (const state of states) {
      expect(state.error).toBeUndefined()

      const iterator = state.returnValue as Iterator<number>
      expect(iterator.next()).toEqual({ value: 1, done: false })
      expect(iterator.next()).toEqual({ value: 2, done: false })
    }
  })

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

  it('yields intrinsic undefined when the name is shadowed', () => {
    const state = executeCode(
      `function* values(undefined: string): Generator<undefined, void, void> {
  yield
}

function run(): unknown[] {
  const yielded = values('shadowed').next().value
  return [yielded, yielded === void 0]
}`,
      {},
      'run'
    )
    const suspend = state.steps.find(
      (step) => step.type === 'yield-suspend'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([undefined, true])
    expect(suspend?.variables[YIELD_VALUE_LABEL]).toBeUndefined()
  })

  it('uses captured intrinsics when global names are shadowed', () => {
    const state = executeCode(
      `function* values(
  Reflect: unknown,
  Symbol: unknown,
  TypeError: unknown,
  __algorithmVisualizerIntrinsics: unknown,
  delegate: Iterable<number>
): Generator<number, void, void> {
  yield 1
  yield* delegate
}

function ShadowedTypeError() {}

function run(): unknown[] {
  const delegate = {
    next() {
      return { done: false, value: 2 }
    },
    return: 1,
    [Symbol.iterator]() {
      return this
    },
  }
  const iterator = values(
    { apply() { throw new Error('shadowed Reflect') } },
    { iterator: Symbol('shadowed') },
    ShadowedTypeError,
    {},
    delegate as Iterable<number>
  )
  const first = iterator.next()
  const second = iterator.next()

  try {
    iterator.return()
    return [first.value, second.value, false]
  } catch (error) {
    return [first.value, second.value, error instanceof TypeError]
  }
}`,
      {},
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([1, 2, true])
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

  it('reactivates a generator frame before return-driven cleanup', () => {
    const state = executeCode(
      `function cleanup(): void {
  const completed = true
}

function* values(): Generator<number, void, void> {
  try {
    yield 1
  } finally {
    cleanup()
  }
}

function run(): void {
  const iterator = values()
  iterator.next()
  iterator.return()
}`,
      {},
      'run'
    )
    const generatorEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'values'
    )
    const cleanupEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'cleanup'
    )
    const returnResumeIndex = state.steps.findIndex(
      (step) =>
        step.type === 'yield-resume' &&
        step.description.startsWith('Generator resumed with return')
    )
    const cleanupIndex = state.steps.findIndex((step) => step === cleanupEntry)

    expect(state.error).toBeUndefined()
    expect(generatorEntry).toBeDefined()
    expect(cleanupEntry).toBeDefined()
    expect(returnResumeIndex).toBeGreaterThan(-1)
    expect(cleanupIndex).toBeGreaterThan(returnResumeIndex)
    expect(cleanupEntry?.metadata?.callFrame?.parentFrameId).toBe(
      generatorEntry?.metadata?.callFrame?.frameId
    )
  })

  it('defers generator completion until a yielding finally finishes', () => {
    const state = executeCode(
      `function* values(): Generator<number, string, void> {
  try {
    return 'original'
  } finally {
    yield 1
  }
}

function run(): unknown[] {
  const iterator = values()
  const suspended = iterator.next()
  const closed = iterator.return('replacement')
  return [suspended.value, suspended.done, closed.value, closed.done]
}`,
      {},
      'run'
    )
    const generatorEntry = state.steps.find(
      (step) =>
        step.type === 'function-entry' &&
        step.metadata?.callFrame?.functionName === 'values'
    )
    const generatorFrameId = generatorEntry?.metadata?.callFrame?.frameId
    const suspendIndex = state.steps.findIndex(
      (step) =>
        step.type === 'yield-suspend' &&
        step.metadata?.callFrame?.frameId === generatorFrameId
    )
    const closeIndex = state.steps.findIndex(
      (step) =>
        step.type === 'generator-close' &&
        step.metadata?.callFrame?.frameId === generatorFrameId
    )
    const generatorReturns = state.steps.filter(
      (step) =>
        step.type === 'return' &&
        step.metadata?.callFrame?.frameId === generatorFrameId
    )
    const atSuspend = getCallFrameInspectorState({
      ...state,
      currentStep: suspendIndex,
    })

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([1, false, 'replacement', true])
    expect(generatorReturns).toEqual([])
    expect(closeIndex).toBeGreaterThan(suspendIndex)
    expect(
      atSuspend.frames.find((frame) => frame.id === generatorFrameId)?.status
    ).toBe('suspended')
  })

  it('records a pending return after a yielding finally resumes', () => {
    const state = executeCode(
      `function* values(): Generator<number, string, void> {
  try {
    return 'original'
  } finally {
    yield 1
  }
}`,
      {},
      'values'
    )
    const suspendIndex = state.steps.findIndex(
      (step) => step.type === 'yield-suspend'
    )
    const returnIndex = state.steps.findIndex(
      (step) =>
        step.type === 'return' &&
        step.metadata?.callFrame?.functionName === 'values'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('original')
    expect(returnIndex).toBeGreaterThan(suspendIndex)
    expect(state.steps[returnIndex]?.variables[RETURN_VALUE_LABEL]).toBe(
      'original'
    )
    expect(
      state.steps.some((step) => step.type === 'generator-close')
    ).toBe(false)
  })

  it('records only the latest return through an outer yielding finally', () => {
    const state = executeCode(
      `function* values(): Generator<number, number, void> {
  try {
    try {
      return 1
    } finally {
      return 2
    }
  } finally {
    yield 3
  }
}`,
      {},
      'values'
    )
    const suspendIndex = state.steps.findIndex(
      (step) => step.type === 'yield-suspend'
    )
    const generatorReturns = state.steps.filter(
      (step) =>
        step.type === 'return' &&
        step.metadata?.callFrame?.functionName === 'values'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(2)
    expect(
      generatorReturns.map((step) => step.variables[RETURN_VALUE_LABEL])
    ).toEqual([2])
    expect(generatorReturns[0]?.stepNumber).toBeGreaterThan(suspendIndex)
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

  it('caches a delegated iterator next method with its receiver', () => {
    const state = executeCode(
      `function* values(accesses: string[]): Generator<string, string, string> {
  const iterator = {
    step: 0,
    [Symbol.iterator]() {
      return this
    },
  }
  Object.defineProperty(iterator, 'next', {
    enumerable: false,
    get() {
      const access = accesses.push('get')
      return function (this: { step: number }, value?: string) {
        if (access > 1) return { done: true, value: 'replacement' }
        this.step += 1
        if (this.step === 1) return { done: false, value: 'first' }
        return { done: true, value: value ?? 'missing' }
      }
    },
  })
  return yield* (iterator as Iterable<string>)
}

function run(): unknown[] {
  const accesses: string[] = []
  const iterator = values(accesses)
  const first = iterator.next()
  const second = iterator.next('resume')
  return [accesses, first.value, second.value]
}`,
      {},
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([['get'], 'first', 'resume'])
  })

  it('invokes delegated methods without reading their call property', () => {
    const state = executeCode(
      `function createDelegate(method: 'next' | 'throw' | 'return') {
  const iterator = {
    step: 0,
    next() {
      this.step += 1
      return { done: false, value: this.step }
    },
    throw(error: Error) {
      return { done: true, value: String(this.step) + ':' + error.message }
    },
    return(value?: string) {
      return { done: true, value: String(this.step) + ':' + (value ?? 'missing') }
    },
    [Symbol.iterator]() {
      return this
    },
  }
  const selectedMethod =
    method === 'next'
      ? iterator.next
      : method === 'throw'
        ? iterator.throw
        : iterator.return
  Object.defineProperty(selectedMethod, 'call', { value: undefined })
  return iterator as Iterable<number>
}

function* values(
  delegate: Iterable<number>
): Generator<number, string, string> {
  return yield* delegate
}

function run(): unknown[] {
  const nextIterator = values(createDelegate('next'))
  const first = nextIterator.next()

  const throwIterator = values(createDelegate('throw'))
  throwIterator.next()
  const thrown = throwIterator.throw(new Error('boom'))

  const returnIterator = values(createDelegate('return'))
  returnIterator.next()
  const returned = returnIterator.return('closed')

  return [first.value, thrown.value, returned.value]
}`,
      {},
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([1, '1:boom', '1:closed'])
  })

  it('reads delegated iterator-result accessors once', () => {
    const accesses: string[] = []
    const iterator: IterableIterator<string> = {
      [Symbol.iterator]() {
        return this
      },
      next() {
        let doneReads = 0
        return {
          get done() {
            accesses.push('done')
            doneReads += 1
            return doneReads > 1
          },
          get value() {
            accesses.push('value')
            return 'first'
          },
        }
      },
    }
    const state = executeCode(
      `function* values(iterator: Iterable<string>): Generator<string, void, void> {
  yield* iterator
}

function run(delegate: Iterable<string>): unknown[] {
  const valuesIterator = values(delegate)
  const first = valuesIterator.next()
  return [first.done, first.value]
}`,
      { iterator },
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([false, 'first'])
    expect(accesses).toEqual(['done', 'value'])
  })

  it('rejects a non-callable delegated iterator return method', () => {
    const state = executeCode(
      `function* values(): Generator<number, void, void> {
  const iterator = {
    next() {
      return { done: false, value: 1 }
    },
    return: 1,
    [Symbol.iterator]() {
      return this
    },
  }
  yield* (iterator as Iterable<number>)
}

function run(): string {
  const iterator = values()
  iterator.next()
  try {
    iterator.return()
    return 'completed'
  } catch (error) {
    return error instanceof TypeError ? 'type-error' : 'other-error'
  }
}`,
      {},
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('type-error')
  })

  it('rejects a non-callable delegated throw method without cleanup', () => {
    const state = executeCode(
      `function* values(effects: string[]): Generator<number, void, void> {
  const iterator = {
    next() {
      return { done: false, value: 1 }
    },
    throw: 1,
    return() {
      effects.push('return')
      return { done: true, value: undefined }
    },
    [Symbol.iterator]() {
      return this
    },
  }
  yield* (iterator as Iterable<number>)
}

function run(): unknown[] {
  const effects: string[] = []
  const iterator = values(effects)
  iterator.next()
  try {
    iterator.throw(new Error('boom'))
    return ['completed', effects]
  } catch (error) {
    const result = error instanceof TypeError ? 'type-error' : 'other-error'
    return [result, effects]
  }
}`,
      {},
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['type-error', []])
  })

  it('caches the fallback delegated iterator return method', () => {
    const state = executeCode(
      `function* values(accesses: string[]): Generator<number, void, void> {
  let returnAccesses = 0
  const iterator = {
    next() {
      return { done: false, value: 1 }
    },
    [Symbol.iterator]() {
      return this
    },
  }
  Object.defineProperty(iterator, 'return', {
    get() {
      accesses.push('get')
      returnAccesses += 1
      if (returnAccesses > 1) throw new Error('second access')
      return function () {
        accesses.push('call')
        return { done: true, value: undefined }
      }
    },
  })
  yield* (iterator as Iterable<number>)
}

function run(): unknown[] {
  const accesses: string[] = []
  const iterator = values(accesses)
  iterator.next()
  try {
    iterator.throw(new Error('boom'))
    return ['completed', accesses]
  } catch (error) {
    const result = error instanceof TypeError ? 'type-error' : 'other-error'
    return [result, accesses]
  }
}`,
      {},
      'run'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual(['type-error', ['get', 'call']])
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

  it('preserves class heap state across yield suspension and resumption', () => {
    const state = executeCode(
      `class MinHeapLocal {
  values: number[] = []

  push(value: number): void {
    this.values.push(value)
  }
}

class GeneratorOwner {
  *values(): Generator<number, void, void> {
    this.minHeap.push(2)
    yield 2
    this.minHeap.push(1)
  }

  private minHeap = new MinHeapLocal()
}

function run(): void {
  const iterator = new GeneratorOwner().values()
  iterator.next()
  iterator.next()
}`,
      {},
      'run'
    )
    const yieldSteps = state.steps.filter(
      (step) =>
        (step.type === 'yield-suspend' || step.type === 'yield-resume') &&
        step.metadata?.callFrame?.functionName === 'values'
    )

    expect(state.error).toBeUndefined()
    expect(yieldSteps.map((step) => step.type)).toEqual([
      'yield-suspend',
      'yield-resume',
    ])
    expect(yieldSteps.map((step) => step.metadata?.heapTrace?.heaps)).toEqual([
      [{ name: 'minHeap', kind: 'min', values: [2] }],
      [{ name: 'minHeap', kind: 'min', values: [2] }],
    ])
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

  it('consumes a synchronous generator before awaiting inherited then', async () => {
    const effects: string[] = []
    const state = await executeCodeAsync(
      `function* answer(effects: string[]): Generator<number, number, void> {
  yield 1
  return 42
}

Object.defineProperty(answer.prototype, 'then', {
  value(resolve: (value: string) => void) {
    effects.push('then')
    resolve('assimilated')
  },
})`,
      { effects },
      'answer'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(42)
    expect(effects).toEqual([])
    expect(
      state.steps
        .filter((step) => step.type === 'yield-suspend')
        .map((step) => step.variables[YIELD_VALUE_LABEL])
    ).toEqual([1])
  })
})
