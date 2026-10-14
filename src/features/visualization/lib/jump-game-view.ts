import type { ExecutionState } from '@/entities/execution'
import {
  isInteger,
  isNonEmptyNumericArray,
  isNumber,
} from '@/shared/lib/guards'

/** Variable mapping inferred from a Jump Game II greedy trace. */
export type JumpGameTraceCandidate = {
  /** Numeric jump-length array. */
  name: string
  /** First step containing a completed jump-range update. */
  stepIndex: number
  /** Loop-index variable. */
  indexName: string
  /** Number of jumps committed so far. */
  jumpsName: string
  /** End of the range reachable with the committed jumps. */
  currentEndName: string
  /** Farthest position reachable while scanning the current range. */
  farthestName: string
}

/** Values displayed by the Jump Game II visualization. */
export type JumpGameVisualizationState = {
  /** Numeric jump-length array. */
  data: number[]
  /** Index currently being scanned. */
  currentIndex: number
  /** Number of jumps committed so far. */
  jumps: number
  /** End of the range reachable with the committed jumps. */
  currentEnd: number
  /** Farthest position reachable from the scanned range. */
  farthest: number
  /** Runtime variable names shown alongside their semantic labels. */
  variableNames: Omit<JumpGameTraceCandidate, 'name' | 'stepIndex'>
}

type JumpGameProgress = Omit<JumpGameVisualizationState, 'data' | 'variableNames'> & {
  stepIndex: number
}

type IndexedJumpGameCandidate = {
  candidate: JumpGameTraceCandidate
  data: number[]
  progress: JumpGameProgress[]
}

const analysisCache = new WeakMap<
  ExecutionState['steps'],
  IndexedJumpGameCandidate | null
>()

const indexNameHints = ['i', 'index', 'position']
const jumpsNameHints = ['jump', 'step']
const currentEndNameHints = ['currentend', 'end', 'boundary', 'range']
const farthestNameHints = ['farthest', 'fartest', 'furthest', 'reach']

function includesNameHint(name: string, hints: string[]): boolean {
  const normalizedName = name.toLowerCase().replaceAll(/[^a-z0-9]/g, '')
  return hints.some((hint) => normalizedName.includes(hint))
}

function getNumericVariableNames(steps: ExecutionState['steps']): string[] {
  const names = new Set<string>()

  for (const step of steps) {
    for (const [name, value] of Object.entries(step.variables)) {
      if (isNumber(value)) names.add(name)
    }
  }

  return [...names]
}

function getNumericSources(
  steps: ExecutionState['steps']
): Array<{ name: string; data: number[] }> {
  const initialStep = steps.find(
    (step) => Object.keys(step.variables).length > 0
  )
  if (!initialStep) return []

  return Object.entries(initialStep.variables).flatMap(([name, value]) =>
    isNonEmptyNumericArray(value) && value.length > 1
      ? [{ name, data: value.map(Number) }]
      : []
  )
}

function getExpectedProgress(data: number[]): Omit<JumpGameProgress, 'stepIndex'>[] {
  let jumps = 0
  let currentEnd = 0
  let farthest = 0

  return data.slice(0, -1).map((value, currentIndex) => {
    farthest = Math.max(farthest, currentIndex + value)

    if (currentIndex === currentEnd) {
      jumps += 1
      currentEnd = farthest
    }

    return { currentIndex, jumps, currentEnd, farthest }
  })
}

function findCandidateForSource({
  steps,
  source,
  numericNames,
}: {
  steps: ExecutionState['steps']
  source: { name: string; data: number[] }
  numericNames: string[]
}): IndexedJumpGameCandidate | undefined {
  const indexNames = numericNames.filter((name) =>
    includesNameHint(name, indexNameHints)
  )
  const jumpsNames = numericNames.filter((name) =>
    includesNameHint(name, jumpsNameHints)
  )
  const currentEndNames = numericNames.filter((name) =>
    includesNameHint(name, currentEndNameHints)
  )
  const farthestNames = numericNames.filter((name) =>
    includesNameHint(name, farthestNameHints)
  )
  const expectedProgress = getExpectedProgress(source.data)

  for (const indexName of indexNames) {
    for (const jumpsName of jumpsNames) {
      for (const currentEndName of currentEndNames) {
        for (const farthestName of farthestNames) {
          if (
            new Set([indexName, jumpsName, currentEndName, farthestName]).size <
            4
          ) {
            continue
          }

          const progress: JumpGameProgress[] = []
          let previousStepIndex = -1

          for (const expected of expectedProgress) {
            const stepIndex = steps.findIndex(
              (step, index) =>
                index > previousStepIndex &&
                step.variables[indexName] === expected.currentIndex &&
                step.variables[jumpsName] === expected.jumps &&
                step.variables[currentEndName] === expected.currentEnd &&
                step.variables[farthestName] === expected.farthest
            )
            if (stepIndex < 0) break

            progress.push({ ...expected, stepIndex })
            previousStepIndex = stepIndex
          }

          if (progress.length !== expectedProgress.length) continue

          return {
            candidate: {
              name: source.name,
              stepIndex: progress[0].stepIndex,
              indexName,
              jumpsName,
              currentEndName,
              farthestName,
            },
            data: source.data,
            progress,
          }
        }
      }
    }
  }

  return undefined
}

function analyzeJumpGameTrace(
  executionState: ExecutionState
): IndexedJumpGameCandidate | undefined {
  const cached = analysisCache.get(executionState.steps)
  if (cached !== undefined) return cached ?? undefined

  const numericNames = getNumericVariableNames(executionState.steps)
  let candidate: IndexedJumpGameCandidate | undefined

  for (const source of getNumericSources(executionState.steps)) {
    candidate = findCandidateForSource({
      steps: executionState.steps,
      source,
      numericNames,
    })
    if (candidate) break
  }

  analysisCache.set(executionState.steps, candidate ?? null)
  return candidate
}

function getProgressAtStep(
  progress: JumpGameProgress[],
  stepIndex: number
): JumpGameProgress | undefined {
  for (let index = progress.length - 1; index >= 0; index -= 1) {
    if (progress[index].stepIndex <= stepIndex) return progress[index]
  }

  return progress[0]
}

/** Detects the range-expanding greedy strategy used by Jump Game II. */
export function getJumpGameTraceCandidate(
  executionState: ExecutionState
): JumpGameTraceCandidate | undefined {
  return analyzeJumpGameTrace(executionState)?.candidate
}

/** Resolves the Jump Game II state nearest to the current playback step. */
export function getJumpGameVisualizationState({
  executionState,
  variableName,
}: {
  executionState: ExecutionState
  variableName: string
}): JumpGameVisualizationState | undefined {
  const analysis = analyzeJumpGameTrace(executionState)
  if (!analysis || analysis.candidate.name !== variableName) return undefined

  const stepIndex = isInteger(executionState.currentStep)
    ? executionState.currentStep
    : analysis.candidate.stepIndex
  const progress = getProgressAtStep(analysis.progress, stepIndex)
  if (!progress) return undefined

  return {
    data: analysis.data,
    currentIndex: progress.currentIndex,
    jumps: progress.jumps,
    currentEnd: progress.currentEnd,
    farthest: progress.farthest,
    variableNames: {
      indexName: analysis.candidate.indexName,
      jumpsName: analysis.candidate.jumpsName,
      currentEndName: analysis.candidate.currentEndName,
      farthestName: analysis.candidate.farthestName,
    },
  }
}
