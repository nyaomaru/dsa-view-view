import type { ExecutionStep, InputValues } from '@/entities/execution'
import { deepClone } from '@/shared/lib/deep-clone'
import { MAX_STEPS, StepLimitError } from './execution-errors'

/**
 * Mutable execution context used while instrumented code records steps.
 */
export type ExecutionContext = {
  /** Next step number to assign. */
  stepNumber: number
  /** Current merged variable state. */
  variables: Record<string, unknown>
  /** Per-step variable changes, cloned at record time. */
  variableDeltas: Record<string, unknown>[]
  /** Lazily restored variable snapshots. */
  variableSnapshotCache: Array<Record<string, unknown> | undefined>
  /** Recorded execution steps. */
  steps: ExecutionStep[]
  /** Current logical call stack. */
  callStack: string[]
}

export function createExecutionContext(inputs: InputValues): ExecutionContext {
  return {
    stepNumber: 0,
    variables: { ...inputs },
    variableDeltas: [],
    variableSnapshotCache: [],
    steps: [],
    callStack: ['root'],
  }
}

function getVariableSnapshot(
  deltas: Record<string, unknown>[],
  cache: Array<Record<string, unknown> | undefined>,
  stepIndex: number
): Record<string, unknown> {
  const cached = cache[stepIndex]

  if (cached) {
    return cached
  }

  let nearestCachedIndex = stepIndex - 1

  while (nearestCachedIndex >= 0 && !cache[nearestCachedIndex]) {
    nearestCachedIndex -= 1
  }

  let snapshot = nearestCachedIndex >= 0 ? { ...cache[nearestCachedIndex] } : {}

  for (let index = nearestCachedIndex + 1; index <= stepIndex; index += 1) {
    snapshot = {
      ...snapshot,
      ...deltas[index],
    }
    cache[index] = snapshot
  }

  return snapshot
}

function createStepWithLazyVariables(
  baseStep: Omit<ExecutionStep, 'variables'>,
  deltas: Record<string, unknown>[],
  cache: Array<Record<string, unknown> | undefined>,
  stepIndex: number
): ExecutionStep {
  const step = baseStep as ExecutionStep

  Object.defineProperty(step, 'variables', {
    enumerable: true,
    configurable: false,
    get: () => getVariableSnapshot(deltas, cache, stepIndex),
  })

  return step
}

export function recordExecutionStep(
  context: ExecutionContext,
  type: ExecutionStep['type'],
  line: number,
  description: string,
  stepVariables: Record<string, unknown>
): ExecutionStep {
  if (context.stepNumber >= MAX_STEPS) {
    throw new StepLimitError(MAX_STEPS)
  }

  Object.assign(context.variables, stepVariables)
  const variablesForStep =
    context.stepNumber === 0 ? context.variables : stepVariables
  const variableDelta = deepClone(variablesForStep)

  if (type === 'function-entry') {
    const functionName =
      description.match(/Entering function: (\w+)/)?.[1] || 'anonymous'
    context.callStack.push(functionName)
  } else if (type === 'return' && context.callStack.length > 1) {
    context.callStack.pop()
  }

  const stepIndex = context.stepNumber++
  context.variableDeltas[stepIndex] = variableDelta

  const step = createStepWithLazyVariables(
    {
      stepNumber: stepIndex,
      type,
      line,
      description,
      timestamp: Date.now(),
      callStack: [...context.callStack],
    },
    context.variableDeltas,
    context.variableSnapshotCache,
    stepIndex
  )
  context.steps.push(step)
  return step
}
