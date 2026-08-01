import { describe, expect, it } from 'vite-plus/test'
import { executeCodeAsync } from './runner'
import { stepBackward, stepForward } from './execution-state'

describe('runner - async execution', () => {
  it('records multiple sequential await boundaries in execution order', async () => {
    const state = await executeCodeAsync(
      `async function calculate(start: number): Promise<number> {
  let value = start
  value += await Promise.resolve(2)
  const next = await Promise.resolve(value + 3)
  return await Promise.resolve(next)
}`,
      { start: 1 },
      'calculate'
    )
    const awaitSteps = state.steps.filter((step) =>
      step.type.startsWith('await-')
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(6)
    expect(awaitSteps.map((step) => step.type)).toEqual([
      'await-suspend',
      'await-resume',
      'await-suspend',
      'await-resume',
      'await-suspend',
      'await-resume',
    ])
    expect(
      state.steps.some(
        (step) =>
          step.type === 'assignment' && step.description.startsWith('value +=')
      )
    ).toBe(true)
  })

  it('reports rejected Promises without losing earlier snapshots', async () => {
    const state = await executeCodeAsync(
      `async function fail(): Promise<void> {
  const before = 'recorded'
  await Promise.reject(new Error('boom'))
  const after = 'unreachable'
}`,
      {},
      'fail'
    )
    const rejectedStep = state.steps.find(
      (step) => step.type === 'await-reject'
    )

    expect(state.error).toBe('boom')
    expect(rejectedStep?.variables.before).toBe('recorded')
    expect(
      state.steps.some((step) => Object.hasOwn(step.variables, 'after'))
    ).toBe(false)
    expect(state.steps.at(-1)?.description).toBe('Error: boom')
  })

  it('rewinds and resumes across an await boundary', async () => {
    const state = await executeCodeAsync(
      `async function double(value: number): Promise<number> {
  const result = await Promise.resolve(value * 2)
  return result
}`,
      { value: 3 },
      'double'
    )
    const resumeIndex = state.steps.findIndex(
      (step) => step.type === 'await-resume'
    )
    const atResume = { ...state, currentStep: resumeIndex }
    const atSuspend = stepBackward(atResume)

    expect(atSuspend.steps[atSuspend.currentStep]?.type).toBe('await-suspend')
    expect(atSuspend.steps[atSuspend.currentStep]?.variables.value).toBe(3)
    expect(stepForward(atSuspend).currentStep).toBe(resumeIndex)
  })

  it('awaits an explicitly returned Promise', async () => {
    const state = await executeCodeAsync(
      `function answer(): Promise<number> {
  return Promise.resolve(42)
}`,
      {},
      'answer'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(42)
    expect(state.steps.at(-1)?.description).toBe('Returned: 42')
  })

  it('preserves synchronous execution through the async worker path', async () => {
    const state = await executeCodeAsync(
      `function add(left: number, right: number): number {
  return left + right
}`,
      { left: 2, right: 3 },
      'add'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(5)
  })
})
