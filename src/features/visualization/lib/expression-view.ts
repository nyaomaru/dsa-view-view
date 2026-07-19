import type { ExecutionState } from '@/entities/execution'
import {
  and,
  arrayOf,
  type Guard,
  isInteger,
  isNumber,
  isString,
  isUndefined,
  oneOfValues,
  predicateToRefine,
} from '@/shared/lib/guards'
import { getExecutionStepSearchOrder } from './execution-step-search'

type Sign = -1 | 1

export type ExpressionAction =
  | 'Preparing expression'
  | 'Reading character'
  | 'Reading digit'
  | 'Applying operator'
  | 'Entering parentheses'
  | 'Leaving parentheses'
  | 'Skipping whitespace'
  | 'Expression complete'

export type ExpressionVisualizationState = {
  /** Full arithmetic expression being scanned. */
  expression: string
  /** Current character index, when the loop index is available. */
  index?: number
  /** Character currently being processed. */
  currentChar?: string
  /** Accumulated result before the pending number is committed. */
  result: number
  /** Number currently being assembled from consecutive digits. */
  currentNumber: number
  /** Sign applied to the pending number. */
  sign: Sign
  /** Nested sign contexts, ordered from bottom to top. */
  signStack: Sign[]
  /** Human-readable operation represented by the current character. */
  action: ExpressionAction
}

const EXPRESSION_NAMES = ['s', 'expression', 'expr'] as const
const RESULT_NAMES = ['res', 'result'] as const
const NUMBER_NAMES = ['num', 'currentNumber'] as const
const SIGN_NAMES = ['sign'] as const
const STACK_NAMES = ['stack', 'signStack', 'signs'] as const
const INDEX_NAMES = ['i', 'index'] as const
const CHARACTER_NAMES = ['char', 'currentChar'] as const

const isSign = oneOfValues(-1, 1)
const isExpression = and(
  isString,
  predicateToRefine<string>((value) => /\d/.test(value) && /[()+-]/.test(value))
)
const isSignStack = and(
  arrayOf(isSign),
  predicateToRefine<readonly Sign[]>((value) => value.length > 0)
)

function readAliasedValue<T>(
  variables: Record<string, unknown>,
  names: readonly string[],
  guard: Guard<T>
): T | undefined {
  for (const name of names) {
    const value = variables[name]
    if (guard(value)) return value
  }

  return undefined
}

function getExpressionAction(
  expression: string,
  index: number | undefined,
  currentChar: string | undefined,
  stepDescription: string
): ExpressionAction {
  if (!isUndefined(index) && index >= expression.length) {
    return 'Expression complete'
  }
  if (
    stepDescription.startsWith('for (') ||
    stepDescription.startsWith('const char =')
  ) {
    return 'Reading character'
  }
  if (isUndefined(currentChar)) return 'Preparing expression'
  if (/\d/.test(currentChar)) return 'Reading digit'
  if (currentChar === '+' || currentChar === '-') return 'Applying operator'
  if (currentChar === '(') return 'Entering parentheses'
  if (currentChar === ')') return 'Leaving parentheses'

  return 'Skipping whitespace'
}

function getExpressionState(
  variables: Record<string, unknown>,
  stepDescription: string
): ExpressionVisualizationState | null {
  const expression = readAliasedValue(variables, EXPRESSION_NAMES, isExpression)
  const result = readAliasedValue(variables, RESULT_NAMES, isNumber)
  const currentNumber = readAliasedValue(variables, NUMBER_NAMES, isNumber)
  const sign = readAliasedValue(variables, SIGN_NAMES, isSign)
  const signStack = readAliasedValue(variables, STACK_NAMES, isSignStack)

  if (
    isUndefined(expression) ||
    isUndefined(result) ||
    isUndefined(currentNumber) ||
    isUndefined(sign) ||
    isUndefined(signStack)
  ) {
    return null
  }

  const index = readAliasedValue(variables, INDEX_NAMES, isInteger)
  const recordedChar = readAliasedValue(variables, CHARACTER_NAMES, isString)
  const currentChar =
    !isUndefined(index) && index >= 0 && index < expression.length
      ? expression[index]
      : recordedChar

  return {
    expression,
    index,
    currentChar,
    result,
    currentNumber,
    sign,
    signStack: [...signStack],
    action: getExpressionAction(
      expression,
      index,
      currentChar,
      stepDescription
    ),
  }
}

/** Finds the first step containing a Basic Calculator-style runtime state. */
export function getExpressionStepIndex(
  executionState: ExecutionState
): number | undefined {
  const stepIndex = executionState.steps.findIndex((step) =>
    Boolean(getExpressionState(step.variables, step.description))
  )

  return stepIndex >= 0 ? stepIndex : undefined
}

/** Derives calculator state from the current step or the nearest usable fallback. */
export function getExpressionVisualizationState(
  executionState: ExecutionState,
  fallbackStepIndex?: number
): ExpressionVisualizationState | null {
  const orderedIndexes = getExecutionStepSearchOrder({
    executionState,
    targetStepIndex: fallbackStepIndex,
    preferPastSteps: true,
    includeFutureSteps: false,
  })

  for (const index of orderedIndexes) {
    const step = executionState.steps[index]
    if (!step) continue

    const state = getExpressionState(step.variables, step.description)
    if (state) return state
  }

  return null
}
