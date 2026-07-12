import type {
  ExecutionStep,
  ExecutionState,
  InputValues,
} from '@/entities/execution'

import {
  compileTypeScriptCode,
  prepareTypeScriptCodeWithClasses,
} from '@/entities/code/compiler'
import { isError, isInstanceOf } from '@/shared/lib/guards'
import { safeStringify } from '@/shared/lib/safe-stringify'

import { instrumentCode } from './instrumenter'
import {
  getStepLimitMessage,
  MAX_STEPS,
  StepLimitError,
} from './execution-errors'
import { createExecutionContext, recordExecutionStep } from './step-recorder'
import {
  buildExecutionWrapperCode,
  createExecutionFunction,
} from './execution-wrapper'

type PreparedExecution = {
  wrapperCode: string
  inputNames: string[]
}

const isStepLimitError = isInstanceOf(
  StepLimitError as unknown as abstract new (
    ...args: unknown[]
  ) => StepLimitError
)

function prepareExecution(
  code: string,
  inputs: InputValues,
  entryFunctionName?: string
): PreparedExecution {
  const preparedSource = prepareTypeScriptCodeWithClasses(code)
  const instrumentedSource = instrumentCode(preparedSource.userCode)
  const sourceWithPreparedClasses = preparedSource.prelude
    ? `${preparedSource.prelude}\n\n${instrumentedSource}`
    : instrumentedSource
  const compilationResult = compileTypeScriptCode(sourceWithPreparedClasses)

  if (!compilationResult.success || !compilationResult.code) {
    const errorMessage =
      compilationResult.errors[0]?.message || 'Compilation failed'
    throw new Error(`Failed to compile instrumented code: ${errorMessage}`)
  }

  return {
    wrapperCode: buildExecutionWrapperCode(
      compilationResult.code,
      code,
      inputs,
      entryFunctionName
    ),
    inputNames: Object.keys(inputs),
  }
}

function createStepLimitWarningStep(
  context: ReturnType<typeof createExecutionContext>
): ExecutionStep {
  const message = getStepLimitMessage(MAX_STEPS)
  const lastStep = context.steps[context.steps.length - 1]

  return {
    stepNumber: context.stepNumber,
    type: 'return',
    line: 0,
    description: `Warning: ${message}`,
    variables: lastStep ? lastStep.variables : {},
    timestamp: Date.now(),
    callStack: [...context.callStack],
  }
}

/**
 * Generator-based execution engine for TypeScript/JavaScript code.
 */
export function* createTypeScriptExecutionRunner(
  code: string,
  inputs: InputValues,
  entryFunctionName?: string
): Generator<ExecutionStep, unknown, undefined> {
  const context = createExecutionContext(inputs)

  const recordStep = (
    type: ExecutionStep['type'],
    line: number,
    description: string,
    stepVariables: Record<string, unknown>
  ): ExecutionStep =>
    recordExecutionStep(context, type, line, description, stepVariables)

  try {
    yield recordStep(
      'function-call',
      0,
      `Function called with: ${safeStringify(inputs)}`,
      {}
    )

    const preparedExecution = prepareExecution(code, inputs, entryFunctionName)
    const func = createExecutionFunction(
      preparedExecution.inputNames,
      preparedExecution.wrapperCode
    )

    let result: unknown
    let stepLimitReached = false

    try {
      result = func(...Object.values(inputs), recordStep)
    } catch (err) {
      if (isStepLimitError(err)) {
        stepLimitReached = true
      } else {
        throw err
      }
    }

    for (let i = 1; i < context.steps.length; i++) {
      yield context.steps[i]
    }

    if (stepLimitReached) {
      yield createStepLimitWarningStep(context)
      return undefined
    }

    yield recordStep('return', 0, `Returned: ${safeStringify(result)}`, {
      result,
    })

    return result
  } catch (error) {
    const errorMessage = isError(error) ? error.message : 'Unknown error'
    for (let i = 1; i < context.steps.length; i++) {
      yield context.steps[i]
    }
    yield recordStep('return', 0, `Error: ${errorMessage}`, {})
    throw error
  }
}

/**
 * Executes TypeScript/JavaScript code and returns complete execution state.
 */
export function executeTypeScriptCode(
  code: string,
  inputs: InputValues,
  entryFunctionName?: string
): ExecutionState {
  const steps: ExecutionStep[] = []
  let returnValue: unknown
  let error: string | undefined

  try {
    const runner = createTypeScriptExecutionRunner(
      code,
      inputs,
      entryFunctionName
    )

    let result = runner.next()
    while (!result.done) {
      steps.push(result.value)
      result = runner.next()
    }

    returnValue = result.value
    const lastStep = steps[steps.length - 1]
    if (
      lastStep?.description === `Warning: ${getStepLimitMessage(MAX_STEPS)}`
    ) {
      error = getStepLimitMessage(MAX_STEPS)
    }
  } catch (err) {
    if (isStepLimitError(err)) {
      error = err.message
    } else {
      error = isError(err) ? err.message : 'Execution failed'
    }
  }

  return {
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    isComplete: false,
    returnValue,
    error,
  }
}

/**
 * Creates initial step-by-step execution state for TypeScript/JavaScript code.
 */
export function createTypeScriptExecutionState(
  code: string,
  inputs: InputValues,
  entryFunctionName?: string
): ExecutionState {
  const fullState = executeTypeScriptCode(code, inputs, entryFunctionName)

  return {
    ...fullState,
    currentStep: 0,
    isComplete: false,
  }
}
