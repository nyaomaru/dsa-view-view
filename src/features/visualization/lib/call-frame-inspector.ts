import {
  FUNCTION_ARGUMENTS_LABEL,
  RETURN_LOCATION_LABEL,
  RETURN_VALUE_LABEL,
  type ExecutionState,
} from '@/entities/execution'
import { isNonArrayObject, isUndefined } from '@/shared/lib/guards'

export type CallFrameStatus =
  | 'current'
  | 'suspended'
  | 'returning'
  | 'completed'

export type InspectedCallFrame = {
  /** Stable runtime invocation identifier. */
  id: number
  /** Parent invocation identifier. */
  parentId?: number
  /** Function or method name. */
  functionName: string
  /** Zero-based call depth. */
  depth: number
  /** Frame status at the selected execution step. */
  status: CallFrameStatus
  /** Step index where the invocation started. */
  startStepIndex: number
  /** Last step index observed for this invocation. */
  lastObservedStepIndex: number
  /** Binding names visible at the frame's last observed step. */
  visibleVariableNames: string[]
  /** Step index where the invocation returned. */
  endStepIndex?: number
  /** Whether a return event has been recorded. */
  hasReturnValue: boolean
}

export type CallFrameDetails = {
  /** Parameter values last observed while this frame executed. */
  parameters: Record<string, unknown>
  /** Local and captured variables last observed while this frame executed. */
  locals: Record<string, unknown>
  /** Value captured by the return event, including undefined. */
  returnValue?: unknown
  /** Source location associated with the return event. */
  returnLocation?: unknown
}

export type CallerFrameContext = {
  /** Caller frame reconstructed immediately before the selected call started. */
  frame: InspectedCallFrame
  /** Caller values from that point in the timeline. */
  details: CallFrameDetails
}

export type CallFrameInspectorState = {
  /** All invocations that have started by the selected step. */
  frames: InspectedCallFrame[]
  /** Active invocation identifiers ordered from caller to callee. */
  activeFrameIds: number[]
  /** Currently executing or returning invocation identifier. */
  currentFrameId?: number
}

type MutableCallFrame = Omit<
  InspectedCallFrame,
  'status' | 'hasReturnValue'
>

const SPECIAL_VARIABLE_NAMES = new Set([
  FUNCTION_ARGUMENTS_LABEL,
  RETURN_LOCATION_LABEL,
  RETURN_VALUE_LABEL,
])

function getCallFrameStatus({
  frameId,
  returningFrameId,
  currentFrameId,
  activeFrameIds,
}: {
  frameId: number
  returningFrameId?: number
  currentFrameId?: number
  activeFrameIds: number[]
}): CallFrameStatus {
  if (frameId === returningFrameId) return 'returning'
  if (frameId === currentFrameId) return 'current'
  if (activeFrameIds.includes(frameId)) return 'suspended'

  return 'completed'
}

function getParameters(
  executionState: ExecutionState,
  frame: MutableCallFrame
): Record<string, unknown> {
  const entryParameters =
    executionState.steps[frame.startStepIndex]?.variables[
      FUNCTION_ARGUMENTS_LABEL
    ]
  if (!isNonArrayObject(entryParameters)) return {}

  const latestVariables =
    executionState.steps[frame.lastObservedStepIndex]?.variables ?? {}

  const latestParameterEntries = Object.entries(entryParameters).map(
    ([name, entryValue]) => {
      const latestValue = Object.hasOwn(latestVariables, name)
        ? latestVariables[name]
        : entryValue

      return [name, latestValue]
    }
  )

  return Object.fromEntries(latestParameterEntries)
}

function getLocals(
  executionState: ExecutionState,
  frame: MutableCallFrame,
  parameterNames: Set<string>
): Record<string, unknown> {
  const variables =
    executionState.steps[frame.lastObservedStepIndex]?.variables ?? {}
  const localVariables: Record<string, unknown> = {}

  for (const name of frame.visibleVariableNames) {
    const isParameter = parameterNames.has(name)
    const isInternalVariable = SPECIAL_VARIABLE_NAMES.has(name)

    if (isParameter || isInternalVariable) continue
    if (!Object.hasOwn(variables, name)) continue

    localVariables[name] = variables[name]
  }

  return localVariables
}

/** Whether an execution contains stable call-frame metadata. */
export function hasCallFrameMetadata(executionState: ExecutionState): boolean {
  return executionState.steps.some((step) => step.metadata?.callFrame)
}

/** Reads variable values only for the frame a user chooses to inspect. */
export function getCallFrameDetails(
  executionState: ExecutionState,
  frame: InspectedCallFrame
): CallFrameDetails {
  const parameters = getParameters(executionState, frame)
  const returnVariables = !isUndefined(frame.endStepIndex)
    ? executionState.steps[frame.endStepIndex]?.variables
    : undefined

  return {
    parameters,
    locals: getLocals(
      executionState,
      frame,
      new Set(Object.keys(parameters))
    ),
    returnValue: returnVariables?.[RETURN_VALUE_LABEL],
    returnLocation: returnVariables?.[RETURN_LOCATION_LABEL],
  }
}

/** Reconstructs the parent frame immediately before a child invocation starts. */
export function getCallerFrameContext(
  executionState: ExecutionState,
  frame: InspectedCallFrame
): CallerFrameContext | undefined {
  if (isUndefined(frame.parentId) || frame.startStepIndex === 0) {
    return undefined
  }

  const stateBeforeCall: ExecutionState = {
    ...executionState,
    currentStep: frame.startStepIndex - 1,
    isComplete: false,
  }
  const callerFrame = getCallFrameInspectorState(
    stateBeforeCall
  ).frames.find((candidate) => candidate.id === frame.parentId)

  if (!callerFrame) return undefined

  return {
    frame: callerFrame,
    details: getCallFrameDetails(executionState, callerFrame),
  }
}

/** Reconstructs call-frame state at the currently selected execution step. */
export function getCallFrameInspectorState(
  executionState: ExecutionState
): CallFrameInspectorState {
  const frames = new Map<number, MutableCallFrame>()
  const activeFrameIds: number[] = []
  let returningFrameId: number | undefined
  const lastStepIndex = Math.min(
    executionState.currentStep,
    executionState.steps.length - 1
  )

  for (let stepIndex = 0; stepIndex <= lastStepIndex; stepIndex += 1) {
    const step = executionState.steps[stepIndex]
    const callFrame = step?.metadata?.callFrame
    if (!step || !callFrame) continue

    if (callFrame.phase === 'enter') {
      frames.set(callFrame.frameId, {
        id: callFrame.frameId,
        parentId: callFrame.parentFrameId,
        functionName: callFrame.functionName,
        depth: activeFrameIds.length,
        startStepIndex: stepIndex,
        lastObservedStepIndex: stepIndex,
        visibleVariableNames: callFrame.visibleVariableNames,
      })
      activeFrameIds.push(callFrame.frameId)
      continue
    }

    const frame = frames.get(callFrame.frameId)
    if (!frame) continue
    frame.lastObservedStepIndex = stepIndex
    frame.visibleVariableNames = callFrame.visibleVariableNames

    if (callFrame.phase !== 'return') continue

    frame.endStepIndex = stepIndex
    const activeIndex = activeFrameIds.lastIndexOf(callFrame.frameId)
    if (activeIndex >= 0) activeFrameIds.splice(activeIndex, 1)
    if (stepIndex === lastStepIndex) returningFrameId = callFrame.frameId
  }

  const currentFrameId =
    returningFrameId ?? activeFrameIds[activeFrameIds.length - 1]

  return {
    activeFrameIds,
    currentFrameId,
    frames: [...frames.values()].map((frame) => {
      const status = getCallFrameStatus({
        frameId: frame.id,
        returningFrameId,
        currentFrameId,
        activeFrameIds,
      })

      return {
        id: frame.id,
        parentId: frame.parentId,
        functionName: frame.functionName,
        depth: frame.depth,
        status,
        startStepIndex: frame.startStepIndex,
        lastObservedStepIndex: frame.lastObservedStepIndex,
        visibleVariableNames: frame.visibleVariableNames,
        endStepIndex: frame.endStepIndex,
        hasReturnValue: !isUndefined(frame.endStepIndex),
      }
    }),
  }
}
