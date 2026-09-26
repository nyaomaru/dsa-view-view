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

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function referencesVariable(expression: string, variableName: string): boolean {
  const escapedName = escapeForRegExp(variableName)
  const identifierPattern = new RegExp(
    `(^|[^A-Za-z0-9_$])${escapedName}(?=$|[^A-Za-z0-9_$])`
  )

  return identifierPattern.test(expression)
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
