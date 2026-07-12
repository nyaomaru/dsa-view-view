import type { ExecutionStepType } from './constants'

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
    /** Related function name. */
    functionName?: string
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
