import {
  CLASS_RECEIVER_LABEL,
  type ExecutionStep,
  type HeapKind,
  type HeapTraceSnapshot,
  type InputValues,
} from '@/entities/execution'
import { deepClone } from '@/shared/lib/deep-clone'
import {
  arrayOf,
  hasKeys,
  isFunction,
  isNonArrayObject,
  isNumber,
  isUndefined,
  oneOfValues,
} from '@/shared/lib/guards'
import { MAX_STEPS, StepLimitError } from './execution-errors'

const PREPARED_HEAP_KIND_LABEL = '__algorithmVisualizerHeapKind'
const isPreparedHeapKind = oneOfValues('min', 'max')
const isLocalHeapClassName = oneOfValues('MinHeap', 'MaxHeap')
const isHeapStorageName = oneOfValues('heap', 'values')
const isNumberArray = arrayOf(isNumber)
const hasPreparedHeapKeys = hasKeys(PREPARED_HEAP_KIND_LABEL, 'values')
const hasPreparedHeapKind = hasKeys(PREPARED_HEAP_KIND_LABEL)

function getHeapKind(
  value: Record<PropertyKey, unknown>
): HeapKind | undefined {
  if (
    hasPreparedHeapKind(value) &&
    isPreparedHeapKind(value[PREPARED_HEAP_KIND_LABEL])
  ) {
    return value[PREPARED_HEAP_KIND_LABEL]
  }

  if (!isFunction(value.constructor)) return undefined

  const className = value.constructor.name
  if (!isLocalHeapClassName(className)) return undefined

  return className === 'MinHeap' ? 'min' : 'max'
}

function getHeapValues(
  value: Record<PropertyKey, unknown>
): number[] | undefined {
  if (hasPreparedHeapKeys(value) && isNumberArray(value.values)) {
    return [...value.values]
  }

  const numericArrays = Object.entries(value).flatMap(([name, candidate]) =>
    isNumberArray(candidate) ? [[name, candidate] as const] : []
  )
  const storage =
    numericArrays.find(([name]) => isHeapStorageName(name)) ??
    (numericArrays.length === 1 ? numericArrays[0] : undefined)

  return storage ? [...storage[1]] : undefined
}

function getHeapTraceSnapshot(
  receiver: unknown
): HeapTraceSnapshot | undefined {
  if (!isNonArrayObject(receiver)) return undefined

  const heaps = Object.entries(receiver).flatMap(([name, value]) => {
    if (!isNonArrayObject(value)) return []

    const kind = getHeapKind(value)
    const values = getHeapValues(value)
    if (isUndefined(kind) || isUndefined(values)) return []

    return [
      {
        name,
        kind,
        values: [...values],
      },
    ]
  })

  return heaps.length > 0 ? { heaps } : undefined
}

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

  const heapTrace = getHeapTraceSnapshot(stepVariables[CLASS_RECEIVER_LABEL])
  const visibleStepVariables = { ...stepVariables }
  delete visibleStepVariables[CLASS_RECEIVER_LABEL]

  Object.assign(context.variables, visibleStepVariables)
  const variablesForStep =
    context.stepNumber === 0 ? context.variables : visibleStepVariables
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
      metadata: heapTrace ? { heapTrace: deepClone(heapTrace) } : undefined,
    },
    context.variableDeltas,
    context.variableSnapshotCache,
    stepIndex
  )
  context.steps.push(step)
  return step
}
