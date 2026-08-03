import {
  CLASS_RECEIVER_LABEL,
  FUNCTION_NAME_LABEL,
  STEP_TYPES,
  type CallFrameStepMetadata,
  type ExecutionStep,
  type InputValues,
} from '@/entities/execution'
import { deepClone } from '@/shared/lib/deep-clone'
import { isInteger, isString } from '@/shared/lib/guards'
import { MAX_STEPS, StepLimitError } from './execution-errors'
import { CALL_FRAME_ID_LABEL } from './frame-identity'
import { createHeapTraceCollector, type HeapTraceCollector } from './heap-trace'

type RuntimeCallFrame = {
  frameId: number
  functionName: string
  parentFrameId?: number
  visibleVariableNames: string[]
  status: 'active' | 'suspended' | 'completed'
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
  /** Next stable identifier assigned to a function invocation. */
  nextFrameId: number
  /** Runtime invocations addressable independently of completion order. */
  frames: Map<number, RuntimeCallFrame>
  /** Invocation currently executing synchronous work. */
  activeFrameId?: number
  /** Execution-scoped heap snapshot collector. */
  heapTraceCollector: HeapTraceCollector
}

export function createExecutionContext(inputs: InputValues): ExecutionContext {
  return {
    stepNumber: 0,
    variables: { ...inputs },
    variableDeltas: [],
    variableSnapshotCache: [],
    steps: [],
    nextFrameId: 1,
    frames: new Map(),
    activeFrameId: undefined,
    heapTraceCollector: createHeapTraceCollector(),
  }
}

function getCallFrameMetadata({
  context,
  type,
  functionName,
  frameId,
  visibleVariableNames,
}: {
  context: ExecutionContext
  type: ExecutionStep['type']
  functionName: unknown
  frameId: unknown
  visibleVariableNames: string[]
}): CallFrameStepMetadata | undefined {
  if (type === 'function-entry') {
    const parentFrame = isInteger(context.activeFrameId)
      ? context.frames.get(context.activeFrameId)
      : undefined
    const frame: RuntimeCallFrame = {
      frameId: context.nextFrameId++,
      functionName: isString(functionName) ? functionName : 'anonymous',
      parentFrameId: parentFrame?.frameId,
      visibleVariableNames,
      status: 'active',
    }
    context.frames.set(frame.frameId, frame)

    return {
      frameId: frame.frameId,
      functionName: frame.functionName,
      parentFrameId: frame.parentFrameId,
      phase: 'enter',
      visibleVariableNames,
    }
  }

  const frame = isInteger(frameId)
    ? context.frames.get(frameId)
    : isInteger(context.activeFrameId)
      ? context.frames.get(context.activeFrameId)
      : undefined
  if (!frame) return undefined

  const retainedVariableNames =
    type === STEP_TYPES.FUNCTION_THROW && visibleVariableNames.length === 0
      ? frame.visibleVariableNames
      : visibleVariableNames
  if (visibleVariableNames.length > 0) {
    frame.visibleVariableNames = visibleVariableNames
  }

  return {
    frameId: frame.frameId,
    functionName: frame.functionName,
    parentFrameId: frame.parentFrameId,
    phase:
      type === STEP_TYPES.RETURN
        ? 'return'
        : type === STEP_TYPES.FUNCTION_THROW
          ? 'throw'
          : 'update',
    visibleVariableNames: retainedVariableNames,
  }
}

function updateActiveFrame(
  context: ExecutionContext,
  type: ExecutionStep['type'],
  callFrame: CallFrameStepMetadata | undefined
): void {
  if (!callFrame) return

  const frame = context.frames.get(callFrame.frameId)
  if (!frame) return

  if (type === STEP_TYPES.AWAIT_SUSPEND) {
    frame.status = 'suspended'
    const parentFrame = isInteger(frame.parentFrameId)
      ? context.frames.get(frame.parentFrameId)
      : undefined
    context.activeFrameId =
      parentFrame?.status === 'active' ? parentFrame.frameId : undefined
    return
  }

  if (type === STEP_TYPES.RETURN || type === STEP_TYPES.FUNCTION_THROW) {
    frame.status = 'completed'
    const parentFrame = isInteger(frame.parentFrameId)
      ? context.frames.get(frame.parentFrameId)
      : undefined
    context.activeFrameId =
      parentFrame?.status === 'active' ? parentFrame.frameId : undefined
    return
  }

  frame.status = 'active'
  context.activeFrameId = frame.frameId
}

function getFrameCallStack(
  context: ExecutionContext,
  frameId: number | undefined
): string[] {
  const functionNames: string[] = []
  const visitedFrameIds = new Set<number>()
  let currentFrameId = frameId

  while (isInteger(currentFrameId) && !visitedFrameIds.has(currentFrameId)) {
    visitedFrameIds.add(currentFrameId)
    const frame = context.frames.get(currentFrameId)
    if (!frame) break

    functionNames.push(frame.functionName)
    currentFrameId = frame.parentFrameId
  }

  return ['root', ...functionNames.reverse()]
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

  const heapTrace = context.heapTraceCollector.capture(
    stepVariables[CLASS_RECEIVER_LABEL]
  )
  const visibleStepVariables = { ...stepVariables }
  delete visibleStepVariables[CLASS_RECEIVER_LABEL]
  const functionName = visibleStepVariables[FUNCTION_NAME_LABEL]
  delete visibleStepVariables[FUNCTION_NAME_LABEL]
  const frameId = visibleStepVariables[CALL_FRAME_ID_LABEL]
  delete visibleStepVariables[CALL_FRAME_ID_LABEL]
  const callFrame = getCallFrameMetadata({
    context,
    type,
    functionName,
    frameId,
    visibleVariableNames: Object.keys(visibleStepVariables),
  })

  Object.assign(context.variables, visibleStepVariables)
  const variablesForStep =
    context.stepNumber === 0 ? context.variables : visibleStepVariables
  const variableDelta = deepClone(variablesForStep)

  updateActiveFrame(context, type, callFrame)
  const callStackFrameId =
    type === STEP_TYPES.RETURN || type === STEP_TYPES.FUNCTION_THROW
      ? callFrame?.parentFrameId
      : (callFrame?.frameId ?? context.activeFrameId)

  const stepIndex = context.stepNumber++
  context.variableDeltas[stepIndex] = variableDelta

  const step = createStepWithLazyVariables(
    {
      stepNumber: stepIndex,
      type,
      line,
      description,
      timestamp: Date.now(),
      callStack: getFrameCallStack(context, callStackFrameId),
      metadata:
        heapTrace || callFrame
          ? {
              ...(heapTrace ? { heapTrace: deepClone(heapTrace) } : {}),
              ...(callFrame ? { callFrame } : {}),
            }
          : undefined,
    },
    context.variableDeltas,
    context.variableSnapshotCache,
    stepIndex
  )
  context.steps.push(step)
  return step
}
