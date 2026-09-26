import type {
  ExecutionState,
  ExecutionStep,
  RuntimeComparison,
} from '@/entities/execution'
import { isInteger, isString } from '@/shared/lib/guards'

type RuntimeComparisonContext = {
  /** Variables represented by the active visualization. */
  variableNames: readonly string[]
  /** Step that defines the active call frame or algorithm segment. */
  stepIndex?: number
}

function isIdentifierStart(character: string): boolean {
  return /[A-Za-z_$]/.test(character)
}

function isIdentifierCharacter(character: string): boolean {
  return /[A-Za-z0-9_$]/.test(character)
}

function skipQuotedText(expression: string, startIndex: number): number {
  const quote = expression[startIndex]
  let index = startIndex + 1

  while (index < expression.length) {
    if (expression[index] === '\\') {
      index += 2
      continue
    }
    if (expression[index] === quote) return index + 1
    index += 1
  }

  return index
}

function getNextNonWhitespaceCharacter(
  expression: string,
  startIndex: number
): string | undefined {
  for (let index = startIndex; index < expression.length; index += 1) {
    if (!/\s/.test(expression[index])) return expression[index]
  }

  return undefined
}

function referencesVariable(expression: string, variableName: string): boolean {
  let index = 0

  while (index < expression.length) {
    const character = expression[index]

    if (character === "'" || character === '"' || character === '`') {
      index = skipQuotedText(expression, index)
      continue
    }
    if (!isIdentifierStart(character)) {
      index += 1
      continue
    }

    const startIndex = index
    index += 1
    while (index < expression.length && isIdentifierCharacter(expression[index])) {
      index += 1
    }

    const identifier = expression.slice(startIndex, index)
    const previousCharacter = expression[startIndex - 1]
    const nextCharacter = getNextNonWhitespaceCharacter(expression, index)
    if (
      identifier === variableName &&
      previousCharacter !== '.' &&
      nextCharacter !== ':'
    ) {
      return true
    }
  }

  return false
}

function isComparisonRelevant(
  comparison: RuntimeComparison,
  variableNames: readonly string[]
): boolean {
  return variableNames.some(
    (name) =>
      referencesVariable(comparison.left.expression, name) ||
      referencesVariable(comparison.right.expression, name)
  )
}

function getAlgorithmSegment(step: ExecutionStep): string | undefined {
  const functionName =
    step.metadata?.callFrame?.functionName ?? step.metadata?.functionName

  return isString(functionName) ? functionName : step.scope
}

function isInActiveContext({
  candidate,
  activeStep,
}: {
  candidate: ExecutionStep
  activeStep: ExecutionStep
}): boolean {
  const activeFrameId = activeStep.metadata?.callFrame?.frameId
  const candidateFrameId = candidate.metadata?.callFrame?.frameId

  if (isInteger(activeFrameId)) return candidateFrameId === activeFrameId

  const activeSegment = getAlgorithmSegment(activeStep)
  if (!activeSegment) return true

  return getAlgorithmSegment(candidate) === activeSegment
}

/** Returns the latest comparison evaluated at or before the playback step. */
export function getLatestRuntimeComparison(
  executionState: ExecutionState
): RuntimeComparison | undefined {
  for (let index = executionState.currentStep; index >= 0; index -= 1) {
    const comparison = executionState.steps[index]?.metadata?.comparison
    if (comparison) return comparison
  }

  return undefined
}

/**
 * Returns the latest comparison relevant to the active visualizer context.
 *
 * A comparison never comes from a future playback step. When call-frame
 * metadata is available, comparisons are restricted to the active invocation;
 * otherwise the active function or scope forms the algorithm segment.
 */
export function getContextualRuntimeComparison(
  executionState: ExecutionState,
  { variableNames, stepIndex = executionState.currentStep }: RuntimeComparisonContext
): RuntimeComparison | undefined {
  const contextStep = executionState.steps[stepIndex]
  const searchStepIndex = Math.min(stepIndex, executionState.currentStep)
  const activeStep = contextStep
  if (!activeStep) return undefined

  for (let index = searchStepIndex; index >= 0; index -= 1) {
    const candidate = executionState.steps[index]
    const comparison = candidate?.metadata?.comparison

    if (
      candidate &&
      comparison &&
      isInActiveContext({ candidate, activeStep }) &&
      isComparisonRelevant(comparison, variableNames)
    ) {
      return comparison
    }
  }

  return undefined
}
