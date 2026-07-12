import type { ExecutionState } from '@/entities/execution'

/**
 * Advances execution state to next step.
 */
export function stepForward(state: ExecutionState): ExecutionState {
  if (state.currentStep >= state.totalSteps - 1) {
    return { ...state, isComplete: true }
  }

  return {
    ...state,
    currentStep: state.currentStep + 1,
    isComplete: state.currentStep + 1 >= state.totalSteps - 1,
  }
}

/**
 * Advances execution state to previous step.
 */
export function stepBackward(state: ExecutionState): ExecutionState {
  if (state.currentStep <= 0) {
    return state
  }

  return {
    ...state,
    currentStep: state.currentStep - 1,
    isComplete: false,
  }
}

/**
 * Resets execution to the first step.
 */
export function resetToStart(state: ExecutionState): ExecutionState {
  return {
    ...state,
    currentStep: 0,
    isComplete: false,
  }
}

/**
 * Skips to the last step.
 */
export function skipToEnd(state: ExecutionState): ExecutionState {
  return {
    ...state,
    currentStep: state.totalSteps - 1,
    isComplete: true,
  }
}
