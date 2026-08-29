import type { ExecutionStepType } from './constants'
import type { RUNTIME_COMPARISON_OPERATORS } from './constants'

export type RuntimeComparisonOperator =
  (typeof RUNTIME_COMPARISON_OPERATORS)[number]

/** One evaluated side of a runtime comparison. */
export type RuntimeComparisonOperand = {
  /** Source expression evaluated for this operand. */
  expression: string
  /** Runtime value produced by the expression, including explicit undefined. */
  value: unknown
}

/** Evaluated operands and outcome captured for one runtime comparison. */
export type RuntimeComparison = {
  /** Evaluated left-hand operand. */
  left: RuntimeComparisonOperand
  /** Comparison operator applied to both operands. */
  operator: RuntimeComparisonOperator
  /** Evaluated right-hand operand. */
  right: RuntimeComparisonOperand
  /** Boolean result produced by the comparison. */
  result: boolean
}

export type HeapKind = 'min' | 'max'

/** Normalized snapshot of one heap owned by or active as a class instance. */
export type HeapSnapshot = {
  /** Property name on the owning class, such as minHeap. */
  name: string
  /** Heap ordering represented by this snapshot. */
  kind: HeapKind
  /** Heap values in array-backed level order. */
  values: number[]
}

/** Heap state captured from the active class receiver. */
export type HeapTraceSnapshot = {
  /** Heaps associated with the active class instance. */
  heaps: HeapSnapshot[]
}

export type CallFramePhase =
  | 'enter'
  | 'update'
  | 'suspend'
  | 'resume'
  | 'return'
  | 'throw'
  | 'close'

/** Runtime identity and visible binding names for one logical call frame. */
export type CallFrameStepMetadata = {
  /** Stable identifier assigned to one function invocation. */
  frameId: number
  /** Parent invocation identifier, when this is a nested call. */
  parentFrameId?: number
  /** Function or method name displayed by the frame inspector. */
  functionName: string
  /** Frame lifecycle event represented by this execution step. */
  phase: CallFramePhase
  /** Variable names visible while this frame recorded the step. */
  visibleVariableNames: string[]
  /** Invocation executing after this lifecycle event, when one remains active. */
  activeFrameIdAfterStep?: number
}

/** Map of user-provided values for function parameters. */
export type InputValues = Record<string, unknown>

/** Information for one execution step. */
export type ExecutionStep = {
  /** Sequential step number. */
  stepNumber: number
  /** Step type. */
  type: ExecutionStepType
  /** Source line number for this step. */
  line: number
  /** Optional source column number for this step. */
  column?: number
  /** Human-readable step description. */
  description: string
  /** Snapshot of variable state at this point. */
  variables: Record<string, unknown>
  /** Timestamp when this step was recorded. */
  timestamp: number
  /** Optional current call stack. */
  callStack?: string[]
  /** Optional variable scope name. */
  scope?: string
  /** Optional metadata for this step. */
  metadata?: {
    /** Loop iteration count. */
    loopIteration?: number
    /** Condition expression result. */
    conditionResult?: boolean
    /** Evaluated operands and result for a runtime comparison. */
    comparison?: RuntimeComparison
    /** Related function name. */
    functionName?: string
    /** Normalized state for MinHeap and MaxHeap instances. */
    heapTrace?: HeapTraceSnapshot
    /** Logical call-frame event associated with this step. */
    callFrame?: CallFrameStepMetadata
  }
}

/** Full execution state. */
export type ExecutionState = {
  /** Current step index. */
  currentStep: number
  /** Total number of steps. */
  totalSteps: number
  /** All recorded steps. */
  steps: ExecutionStep[]
  /** Whether execution is complete. */
  isComplete: boolean
  /** Optional function return value. */
  returnValue?: unknown
  /** Optional error message raised during execution. */
  error?: string
}
