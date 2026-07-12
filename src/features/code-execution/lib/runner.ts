import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@/entities/code'
import type {
  ExecutionState,
  ExecutionStep,
  InputValues,
} from '@/entities/execution'

import {
  createTypeScriptExecutionRunner,
  executeTypeScriptCode,
} from './typescript-runner'
export {
  resetToStart,
  skipToEnd,
  stepBackward,
  stepForward,
} from './execution-state'

/**
 * Creates a step generator through the selected language adapter when supported.
 */
export function createExecutionRunner(
  code: string,
  inputs: InputValues,
  entryFunctionName?: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): Generator<ExecutionStep, unknown, undefined> {
  if (language === 'typescript') {
    return createTypeScriptExecutionRunner(code, inputs, entryFunctionName)
  }

  throw new Error(
    `Language "${String(language)}" does not support step-by-step execution yet`
  )
}

/**
 * Executes code and returns complete execution state.
 */
export function executeCode(
  code: string,
  inputs: InputValues,
  entryFunctionName?: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): ExecutionState {
  if (language === 'typescript') {
    return executeTypeScriptCode(code, inputs, entryFunctionName)
  }

  throw new Error(
    `Language "${String(language)}" does not support execution yet`
  )
}

/**
 * Creates initial execution state for step-by-step visualization.
 */
export function createExecutionState(
  code: string,
  inputs: Record<string, unknown>,
  entryFunctionName?: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): ExecutionState {
  const fullState = executeCode(code, inputs, entryFunctionName, language)

  return {
    ...fullState,
    currentStep: 0,
    isComplete: false,
  }
}
