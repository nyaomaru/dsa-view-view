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

function getPreviousNonWhitespaceCharacter(
  expression: string,
  startIndex: number
): string | undefined {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    if (!/\s/.test(expression[index])) return expression[index]
  }

  return undefined
}

function canStartRegularExpression(
  expression: string,
  startIndex: number
): boolean {
  const previousCharacter = getPreviousNonWhitespaceCharacter(
    expression,
    startIndex
  )

  return (
    previousCharacter === undefined ||
    '([{:;,=!?&|+-*%^~<>'.includes(previousCharacter)
  )
}

function skipRegularExpression(expression: string, startIndex: number): number {
  let index = startIndex + 1
  let isInCharacterClass = false

  while (index < expression.length) {
    const character = expression[index]
    if (character === '\\') {
      index += 2
      continue
    }
    if (character === '[') isInCharacterClass = true
    if (character === ']') isInCharacterClass = false
    if (character === '/' && !isInCharacterClass) {
      index += 1
      while (index < expression.length && /[A-Za-z]/.test(expression[index])) {
        index += 1
      }
      return index
    }
    index += 1
  }

  return index
}

function skipComment(expression: string, startIndex: number): number {
  if (expression[startIndex + 1] === '/') {
    const newlineIndex = expression.indexOf('\n', startIndex + 2)
    return newlineIndex === -1 ? expression.length : newlineIndex + 1
  }

  const endIndex = expression.indexOf('*/', startIndex + 2)
  return endIndex === -1 ? expression.length : endIndex + 2
}

function findTemplateInterpolationEnd(
  expression: string,
  startIndex: number
): number {
  let depth = 1
  let index = startIndex

  while (index < expression.length) {
    const character = expression[index]

    if (character === "'" || character === '"' || character === '`') {
      index = skipQuotedText(expression, index)
      continue
    }
    if (character === '/' && expression[index + 1] === '/') {
      index = skipComment(expression, index)
      continue
    }
    if (character === '/' && expression[index + 1] === '*') {
      index = skipComment(expression, index)
      continue
    }
    if (character === '/' && canStartRegularExpression(expression, index)) {
      index = skipRegularExpression(expression, index)
      continue
    }
    if (character === '{') depth += 1
    if (character === '}') {
      depth -= 1
      if (depth === 0) return index
    }
    index += 1
  }

  return expression.length
}

function scanTemplateLiteral(
  expression: string,
  variableName: string,
  startIndex: number
): { endIndex: number; referencesVariable: boolean } {
  let index = startIndex + 1

  while (index < expression.length) {
    const character = expression[index]
    if (character === '\\') {
      index += 2
      continue
    }
    if (character === '`') {
      return { endIndex: index + 1, referencesVariable: false }
    }
    if (character === '$' && expression[index + 1] === '{') {
      const interpolationStart = index + 2
      const interpolationEnd = findTemplateInterpolationEnd(
        expression,
        interpolationStart
      )
      if (
        referencesVariable(
          expression.slice(interpolationStart, interpolationEnd),
          variableName
        )
      ) {
        return { endIndex: interpolationEnd + 1, referencesVariable: true }
      }
      index = interpolationEnd + 1
      continue
    }
    index += 1
  }

  return { endIndex: index, referencesVariable: false }
}

function getNextNonWhitespaceIndex(
  expression: string,
  startIndex: number
): number | undefined {
  for (let index = startIndex; index < expression.length; index += 1) {
    if (!/\s/.test(expression[index])) return index
  }

  return undefined
}

function getArrowBodyStart(
  expression: string,
  parameterEndIndex: number
): number | undefined {
  let arrowStartIndex = getNextNonWhitespaceIndex(
    expression,
    parameterEndIndex
  )
  if (expression[arrowStartIndex ?? -1] === ')') {
    arrowStartIndex = getNextNonWhitespaceIndex(
      expression,
      (arrowStartIndex ?? 0) + 1
    )
  }
  if (
    arrowStartIndex === undefined ||
    expression[arrowStartIndex] !== '=' ||
    expression[arrowStartIndex + 1] !== '>'
  ) {
    return undefined
  }

  return getNextNonWhitespaceIndex(expression, arrowStartIndex + 2)
}

function getArrowExpressionEnd(
  expression: string,
  bodyStartIndex: number
): number {
  if (expression[bodyStartIndex] === '{') {
    return findTemplateInterpolationEnd(expression, bodyStartIndex + 1)
  }

  let nestingDepth = 0
  let index = bodyStartIndex
  while (index < expression.length) {
    const character = expression[index]
    if (character === "'" || character === '"' || character === '`') {
      index = skipQuotedText(expression, index)
      continue
    }
    if (character === '/' && expression[index + 1] === '/') {
      index = skipComment(expression, index)
      continue
    }
    if (character === '/' && expression[index + 1] === '*') {
      index = skipComment(expression, index)
      continue
    }
    if (character === '/' && canStartRegularExpression(expression, index)) {
      index = skipRegularExpression(expression, index)
      continue
    }
    if (character === '(' || character === '[' || character === '{') {
      nestingDepth += 1
    } else if (character === ')' || character === ']' || character === '}') {
      if (nestingDepth === 0) return index
      nestingDepth -= 1
    } else if (character === ',' && nestingDepth === 0) {
      return index
    }
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
  const shadowedRanges: Array<{ start: number; end: number }> = []

  while (index < expression.length) {
    const character = expression[index]

    if (character === "'" || character === '"') {
      index = skipQuotedText(expression, index)
      continue
    }
    if (character === '`') {
      const template = scanTemplateLiteral(expression, variableName, index)
      if (template.referencesVariable) return true
      index = template.endIndex
      continue
    }
    if (character === '/' && expression[index + 1] === '/') {
      index = skipComment(expression, index)
      continue
    }
    if (character === '/' && expression[index + 1] === '*') {
      index = skipComment(expression, index)
      continue
    }
    if (character === '/' && canStartRegularExpression(expression, index)) {
      index = skipRegularExpression(expression, index)
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
    const arrowBodyStart = getArrowBodyStart(expression, index)
    if (identifier === variableName && arrowBodyStart !== undefined) {
      shadowedRanges.push({
        start: arrowBodyStart,
        end: getArrowExpressionEnd(expression, arrowBodyStart),
      })
      continue
    }
    const previousCharacter = expression[startIndex - 1]
    const previousNonWhitespaceCharacter = getPreviousNonWhitespaceCharacter(
      expression,
      startIndex
    )
    const nextCharacter = getNextNonWhitespaceCharacter(expression, index)
    if (
      identifier === variableName &&
      previousCharacter !== '.' &&
      !shadowedRanges.some(
        (range) => startIndex >= range.start && startIndex < range.end
      ) &&
      !(
        nextCharacter === ':' &&
        (previousNonWhitespaceCharacter === '{' ||
          previousNonWhitespaceCharacter === ',')
      )
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
