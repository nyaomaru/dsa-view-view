import { describe, expect, it } from 'vite-plus/test'

import {
  FUNCTION_ARGUMENTS_LABEL,
  RETURN_LOCATION_LABEL,
  RETURN_VALUE_LABEL,
  type CallFramePhase,
  type ExecutionState,
} from '@/entities/execution'
import {
  getCallFrameDetails,
  getCallFrameInspectorState,
  getCallerFrameContext,
  hasCallFrameMetadata,
} from './call-frame-inspector'

function createStep({
  frameId,
  parentFrameId,
  functionName,
  phase,
  variables,
  visibleVariableNames = Object.keys(variables),
}: {
  frameId: number
  parentFrameId?: number
  functionName: string
  phase: CallFramePhase
  variables: Record<string, unknown>
  visibleVariableNames?: string[]
}): ExecutionState['steps'][number] {
  return {
    stepNumber: 1,
    type:
      phase === 'enter'
        ? 'function-entry'
        : phase === 'return'
          ? 'return'
          : phase === 'throw'
            ? 'function-throw'
            : 'assignment',
    line: 1,
    description: `${functionName} ${phase}`,
    variables,
    timestamp: 0,
    metadata: {
      callFrame: {
        frameId,
        parentFrameId,
        functionName,
        phase,
        visibleVariableNames,
      },
    },
  }
}

const steps: ExecutionState['steps'] = [
  createStep({
    frameId: 1,
    functionName: 'dfs',
    phase: 'enter',
    variables: {
      [FUNCTION_ARGUMENTS_LABEL]: { node: 'root', depth: 0 },
      node: 'root',
      depth: 0,
    },
  }),
  createStep({
    frameId: 1,
    functionName: 'dfs',
    phase: 'update',
    variables: { node: 'root', depth: 0, total: 0 },
  }),
  createStep({
    frameId: 2,
    parentFrameId: 1,
    functionName: 'dfs',
    phase: 'enter',
    variables: {
      [FUNCTION_ARGUMENTS_LABEL]: { node: 'left', depth: 1 },
      node: 'left',
      depth: 1,
      total: 0,
    },
    visibleVariableNames: [FUNCTION_ARGUMENTS_LABEL, 'node', 'depth'],
  }),
  createStep({
    frameId: 2,
    parentFrameId: 1,
    functionName: 'dfs',
    phase: 'update',
    variables: {
      node: 'left',
      depth: 1,
      total: 0,
      childOnly: 'left frame',
    },
    visibleVariableNames: ['node', 'depth', 'childOnly'],
  }),
  createStep({
    frameId: 2,
    parentFrameId: 1,
    functionName: 'dfs',
    phase: 'return',
    variables: {
      node: 'left',
      depth: 1,
      total: 0,
      childOnly: 'left frame',
      [RETURN_VALUE_LABEL]: 1,
      [RETURN_LOCATION_LABEL]: { line: 8 },
    },
    visibleVariableNames: [
      'node',
      'depth',
      'childOnly',
      RETURN_VALUE_LABEL,
      RETURN_LOCATION_LABEL,
    ],
  }),
  createStep({
    frameId: 1,
    functionName: 'dfs',
    phase: 'update',
    variables: {
      node: 'root',
      depth: 0,
      total: 1,
      childOnly: 'left frame',
    },
    visibleVariableNames: ['node', 'depth', 'total'],
  }),
  createStep({
    frameId: 3,
    parentFrameId: 1,
    functionName: 'dfs',
    phase: 'enter',
    variables: {
      [FUNCTION_ARGUMENTS_LABEL]: { node: 'right', depth: 1 },
      node: 'right',
      depth: 1,
      total: 1,
    },
    visibleVariableNames: [FUNCTION_ARGUMENTS_LABEL, 'node', 'depth'],
  }),
]

function createState(currentStep: number): ExecutionState {
  return {
    currentStep,
    totalSteps: steps.length,
    steps,
    isComplete: false,
  }
}

describe('call-frame inspector', () => {
  it('keeps suspended caller locals separate from the current invocation', () => {
    const state = getCallFrameInspectorState(createState(3))

    expect(state.activeFrameIds).toEqual([1, 2])
    expect(state.currentFrameId).toBe(2)
    expect(state.frames).toEqual([
      expect.objectContaining({ id: 1, status: 'suspended' }),
      expect.objectContaining({ id: 2, parentId: 1, status: 'current' }),
    ])

    const parentFrame = state.frames[0]!
    const childFrame = state.frames[1]!
    const parentDetails = getCallFrameDetails(createState(3), parentFrame)
    const childDetails = getCallFrameDetails(createState(3), childFrame)

    expect(parentDetails).toEqual(
      expect.objectContaining({
        parameters: { node: 'root', depth: 0 },
        locals: { total: 0 },
      })
    )
    expect(childDetails).toEqual(
      expect.objectContaining({
        parameters: { node: 'left', depth: 1 },
        locals: { childOnly: 'left frame' },
      })
    )
    expect(parentDetails.locals).not.toHaveProperty('childOnly')
  })

  it('shows a frame as returning with its captured return value', () => {
    const state = getCallFrameInspectorState(createState(4))
    const childFrame = state.frames.find((frame) => frame.id === 2)

    expect(state.currentFrameId).toBe(2)
    expect(childFrame).toEqual(
      expect.objectContaining({
        status: 'returning',
        hasReturnValue: true,
      })
    )
    expect(getCallFrameDetails(createState(4), childFrame!)).toEqual(
      expect.objectContaining({
        returnValue: 1,
        returnLocation: { line: 8 },
      })
    )
  })

  it('shows a parameter value from the frame latest observed step', () => {
    const changedParameterSteps = [
      createStep({
        frameId: 1,
        functionName: 'walk',
        phase: 'enter',
        variables: {
          [FUNCTION_ARGUMENTS_LABEL]: { index: 0 },
          index: 0,
        },
      }),
      createStep({
        frameId: 1,
        functionName: 'walk',
        phase: 'update',
        variables: { index: 1 },
      }),
    ]
    const state = getCallFrameInspectorState({
      currentStep: 1,
      totalSteps: changedParameterSteps.length,
      steps: changedParameterSteps,
      isComplete: false,
    })

    const frameDetails = getCallFrameDetails(
      {
        currentStep: 1,
        totalSteps: changedParameterSteps.length,
        steps: changedParameterSteps,
        isComplete: false,
      },
      state.frames[0]!
    )

    expect(frameDetails.parameters).toEqual({ index: 1 })
    expect(frameDetails.locals).toEqual({})
  })

  it('restores the caller and retains the completed child after returning', () => {
    const state = getCallFrameInspectorState(createState(5))
    const parentFrame = state.frames.find((frame) => frame.id === 1)
    const childFrame = state.frames.find((frame) => frame.id === 2)

    expect(state.activeFrameIds).toEqual([1])
    expect(parentFrame).toEqual(expect.objectContaining({ status: 'current' }))
    expect(childFrame).toEqual(expect.objectContaining({ status: 'completed' }))
    expect(getCallFrameDetails(createState(5), parentFrame!).locals).toEqual({
      total: 1,
    })
    expect(getCallFrameDetails(createState(5), childFrame!).returnValue).toBe(1)
  })

  it('reconstructs concurrent sibling frames across timeline steps', () => {
    const concurrentSteps = [
      createStep({
        frameId: 1,
        functionName: 'run',
        phase: 'enter',
        variables: {},
      }),
      createStep({
        frameId: 2,
        parentFrameId: 1,
        functionName: 'fast',
        phase: 'enter',
        variables: { branch: 'fast' },
      }),
      createStep({
        frameId: 2,
        parentFrameId: 1,
        functionName: 'fast',
        phase: 'update',
        variables: { branch: 'fast', state: 'suspended' },
      }),
      createStep({
        frameId: 3,
        parentFrameId: 1,
        functionName: 'slow',
        phase: 'enter',
        variables: { branch: 'slow' },
      }),
      createStep({
        frameId: 3,
        parentFrameId: 1,
        functionName: 'slow',
        phase: 'update',
        variables: { branch: 'slow', state: 'suspended' },
      }),
      createStep({
        frameId: 2,
        parentFrameId: 1,
        functionName: 'fast',
        phase: 'update',
        variables: { branch: 'fast', state: 'resumed' },
      }),
      createStep({
        frameId: 2,
        parentFrameId: 1,
        functionName: 'fast',
        phase: 'return',
        variables: { branch: 'fast', [RETURN_VALUE_LABEL]: 'fast' },
      }),
      createStep({
        frameId: 3,
        parentFrameId: 1,
        functionName: 'slow',
        phase: 'update',
        variables: { branch: 'slow', state: 'resumed' },
      }),
    ]
    const createConcurrentState = (currentStep: number): ExecutionState => ({
      currentStep,
      totalSteps: concurrentSteps.length,
      steps: concurrentSteps,
      isComplete: false,
    })
    const atSlowSuspend = getCallFrameInspectorState(createConcurrentState(4))
    const atFastResume = getCallFrameInspectorState(createConcurrentState(5))
    const atFastReturn = getCallFrameInspectorState(createConcurrentState(6))
    const afterFastReturn = getCallFrameInspectorState(createConcurrentState(7))

    expect(atSlowSuspend.activeFrameIds).toEqual([1, 2, 3])
    expect(atSlowSuspend.currentFrameId).toBe(3)
    expect(
      atSlowSuspend.frames.map((frame) => ({
        id: frame.id,
        depth: frame.depth,
        status: frame.status,
      }))
    ).toEqual([
      { id: 1, depth: 0, status: 'suspended' },
      { id: 2, depth: 1, status: 'suspended' },
      { id: 3, depth: 1, status: 'current' },
    ])
    expect(atFastResume.currentFrameId).toBe(2)
    expect(atFastResume.frames.find((frame) => frame.id === 3)?.status).toBe(
      'suspended'
    )
    expect(atFastReturn.activeFrameIds).toEqual([1, 3])
    expect(atFastReturn.frames.find((frame) => frame.id === 2)?.status).toBe(
      'returning'
    )
    expect(afterFastReturn.currentFrameId).toBe(3)
    expect(afterFastReturn.frames.find((frame) => frame.id === 2)?.status).toBe(
      'completed'
    )
  })

  it('completes a throwing frame without removing its active sibling', () => {
    const throwingSteps = [
      createStep({
        frameId: 1,
        functionName: 'run',
        phase: 'enter',
        variables: {},
      }),
      createStep({
        frameId: 2,
        parentFrameId: 1,
        functionName: 'rejectBranch',
        phase: 'enter',
        variables: { branch: 'reject' },
      }),
      createStep({
        frameId: 3,
        parentFrameId: 1,
        functionName: 'completeBranch',
        phase: 'enter',
        variables: { branch: 'complete' },
      }),
      createStep({
        frameId: 2,
        parentFrameId: 1,
        functionName: 'rejectBranch',
        phase: 'throw',
        variables: { branch: 'reject' },
      }),
      createStep({
        frameId: 3,
        parentFrameId: 1,
        functionName: 'completeBranch',
        phase: 'update',
        variables: { branch: 'complete', state: 'resumed' },
      }),
    ]
    const createThrowingState = (currentStep: number): ExecutionState => ({
      currentStep,
      totalSteps: throwingSteps.length,
      steps: throwingSteps,
      isComplete: false,
    })
    const atThrow = getCallFrameInspectorState(createThrowingState(3))
    const afterThrow = getCallFrameInspectorState(createThrowingState(4))

    expect(atThrow.activeFrameIds).toEqual([1, 3])
    expect(atThrow.currentFrameId).toBe(2)
    expect(atThrow.frames.find((frame) => frame.id === 2)).toEqual(
      expect.objectContaining({
        status: 'throwing',
        completionPhase: 'throw',
        hasReturnValue: false,
      })
    )
    expect(afterThrow.currentFrameId).toBe(3)
    expect(afterThrow.activeFrameIds).toEqual([1, 3])
    expect(afterThrow.frames.find((frame) => frame.id === 2)?.status).toBe(
      'completed'
    )
  })

  it('reconstructs only frames that exist at an earlier timeline step', () => {
    const state = getCallFrameInspectorState(createState(1))

    expect(state.frames.map((frame) => frame.id)).toEqual([1])
    expect(state.currentFrameId).toBe(1)
  })

  it('reconstructs caller variables from immediately before each child call', () => {
    const executionState = createState(6)
    const state = getCallFrameInspectorState(executionState)
    const firstChild = state.frames.find((frame) => frame.id === 2)
    const secondChild = state.frames.find((frame) => frame.id === 3)

    const firstCaller = getCallerFrameContext(executionState, firstChild!)
    const secondCaller = getCallerFrameContext(executionState, secondChild!)

    expect(firstCaller?.frame.id).toBe(1)
    expect(firstCaller?.details.locals).toEqual({ total: 0 })
    expect(secondCaller?.frame.id).toBe(1)
    expect(secondCaller?.details.locals).toEqual({ total: 1 })
  })

  it('leaves legacy traces available to the recursion-tree fallback', () => {
    const state: ExecutionState = {
      currentStep: 0,
      totalSteps: 1,
      steps: [
        {
          stepNumber: 1,
          type: 'function-entry',
          line: 1,
          description: 'Entering function: dfs',
          variables: {},
          timestamp: 0,
        },
      ],
      isComplete: false,
    }

    expect(hasCallFrameMetadata(state)).toBe(false)
    expect(getCallFrameInspectorState(state)).toEqual({
      frames: [],
      activeFrameIds: [],
      currentFrameId: undefined,
    })
  })
})
