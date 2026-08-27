import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import {
  isInteger,
  isNonEmptyNumericArray,
  isNumber,
} from '@/shared/lib/guards'

type CapacityBounds = {
  left: number
  right: number
  mid: number
}

type CapacityProgress = {
  stepIndex: number
  frameId: number
  capacity: number
  currentIndex: number
}

type IndexedCapacityCandidate = {
  candidate: CapacitySearchTraceCandidate
  data: number[]
  totalWeight: number
  targetDays: number
  progress: CapacityProgress[]
}

type InitialCapacityPass = {
  name: string
  data: number[]
  totalWeight: number
  targetDays: number
  loopDescription: string
}

/** Capacity-search trace inferred from a shipping feasibility check. */
export type CapacitySearchTraceCandidate = {
  /** Package-weight array variable. */
  name: string
  /** First step that checks one package against a candidate capacity. */
  stepIndex: number
}

/** Package placement under the currently tested capacity. */
export type CapacityPackageState = {
  /** Source-array index. */
  index: number
  /** Package weight. */
  weight: number
  /** One-based shipping day assigned by the greedy check. */
  day: number
  /** Load on that day after adding this package. */
  load: number
}

/** Values displayed by the capacity-search visualization. */
export type CapacitySearchVisualizationState = {
  /** Current lower capacity bound. */
  left: number
  /** Current upper capacity bound. */
  right: number
  /** Current binary-search candidate. */
  mid: number
  /** Capacity used by the active feasibility pass. */
  capacity: number
  /** Whether the binary search has converged on its result capacity. */
  isConverged: boolean
  /** Sum of all package weights. */
  totalWeight: number
  /** Maximum allowed shipping days. */
  targetDays: number
  /** Current package-array index. */
  currentIndex: number
  /** Weight at the current package-array index. */
  currentWeight: number
  /** Greedy package placement for the active capacity. */
  packages: CapacityPackageState[]
  /** Number of days needed through the current package. */
  requiredDays: number
  /** Current day's load after the current package. */
  currentLoad: number
  /** Whether the active capacity can ship every package in time. */
  canShip: boolean
}

const analysisCache = new WeakMap<
  ExecutionState['steps'],
  IndexedCapacityCandidate | null
>()

function getCapacityBounds(
  variables: ExecutionStep['variables']
): CapacityBounds | undefined {
  const left = variables.left
  const right = variables.right
  const mid = variables.mid

  if (!isInteger(left) || !isInteger(right) || !isInteger(mid)) {
    return undefined
  }

  return { left, right, mid }
}

function getCapacityPackages(
  data: number[],
  capacity: number
): CapacityPackageState[] {
  let day = 1
  let load = 0

  return data.map((weight, index) => {
    if (load + weight > capacity) {
      day += 1
      load = weight
    } else {
      load += weight
    }

    return { index, weight, day, load }
  })
}

function getInitialCapacityPass(
  step: ExecutionStep
): InitialCapacityPass | undefined {
  const match = /^for \(\.\.\. of ([A-Za-z_$][\w$]*)\)$/.exec(step.description)
  if (!match) return undefined

  const name = match[1]
  const source = step.variables[name]
  const bounds = getCapacityBounds(step.variables)
  const capacity = step.variables.capacity
  const targetDays = step.variables.days
  const requiredDays = step.variables.requiredDays
  const currentLoad = step.variables.current
  const currentWeight = step.variables.weight

  if (
    !isNonEmptyNumericArray(source) ||
    !bounds ||
    !isNumber(capacity) ||
    !isInteger(targetDays) ||
    !isInteger(requiredDays) ||
    !isNumber(currentLoad) ||
    !isNumber(currentWeight) ||
    targetDays <= 0
  ) {
    return undefined
  }

  const data = source.map(Number)
  const totalWeight = data.reduce((sum, weight) => sum + weight, 0)
  const maximumWeight = Math.max(...data)

  if (
    bounds.left !== maximumWeight ||
    bounds.right !== totalWeight ||
    bounds.mid !== capacity
  ) {
    return undefined
  }

  return {
    name,
    data,
    totalWeight,
    targetDays,
    loopDescription: step.description,
  }
}

function collectCapacityProgress({
  steps,
  initialStepIndex,
  initialPass,
}: {
  steps: ExecutionState['steps']
  initialStepIndex: number
  initialPass: InitialCapacityPass
}): CapacityProgress[] {
  const frameIndexes = new Map<number, number>()
  const progress: CapacityProgress[] = []

  for (
    let stepIndex = initialStepIndex;
    stepIndex < steps.length;
    stepIndex += 1
  ) {
    const step = steps[stepIndex]
    if (step.description !== initialPass.loopDescription) continue

    const loopData = step.variables[initialPass.name]
    const frameId = step.metadata?.callFrame?.frameId
    const capacity = step.variables.capacity
    const weight = step.variables.weight

    if (
      !isNonEmptyNumericArray(loopData) ||
      !isInteger(frameId) ||
      !isNumber(capacity) ||
      !isNumber(weight)
    ) {
      continue
    }

    const currentIndex = frameIndexes.get(frameId) ?? 0
    if (
      currentIndex >= initialPass.data.length ||
      initialPass.data[currentIndex] !== weight
    ) {
      continue
    }

    progress.push({ stepIndex, frameId, capacity, currentIndex })
    frameIndexes.set(frameId, currentIndex + 1)
  }

  return progress
}

function findCandidate(
  steps: ExecutionState['steps']
): IndexedCapacityCandidate | undefined {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    const initialPass = getInitialCapacityPass(steps[stepIndex])
    if (!initialPass) continue

    const progress = collectCapacityProgress({
      steps,
      initialStepIndex: stepIndex,
      initialPass,
    })

    if (progress.length === 0) continue

    return {
      candidate: {
        name: initialPass.name,
        stepIndex: progress[0].stepIndex,
      },
      data: initialPass.data,
      totalWeight: initialPass.totalWeight,
      targetDays: initialPass.targetDays,
      progress,
    }
  }

  return undefined
}

function analyzeCapacityTrace(
  executionState: ExecutionState
): IndexedCapacityCandidate | undefined {
  const cached = analysisCache.get(executionState.steps)
  if (cached !== undefined) return cached ?? undefined

  const analysis = findCandidate(executionState.steps)
  analysisCache.set(executionState.steps, analysis ?? null)
  return analysis
}

function findBoundsAtStep(
  steps: ExecutionState['steps'],
  currentStep: number,
  fallbackStep: number
): CapacityBounds | undefined {
  for (let index = currentStep; index >= 0; index -= 1) {
    const bounds = getCapacityBounds(steps[index].variables)
    if (bounds) return bounds
  }

  return getCapacityBounds(steps[fallbackStep].variables)
}

function getProgressAtStep({
  steps,
  progress,
  currentStep,
  mid,
}: {
  steps: ExecutionState['steps']
  progress: CapacityProgress[]
  currentStep: number
  mid: number
}): CapacityProgress | undefined {
  const currentFrameId = steps[currentStep]?.metadata?.callFrame?.frameId
  const frameProgress = isInteger(currentFrameId)
    ? progress.filter((item) => item.frameId === currentFrameId)
    : []
  const matchingProgress =
    frameProgress.length > 0
      ? frameProgress
      : progress.filter((item) => item.capacity === mid)

  for (let index = matchingProgress.length - 1; index >= 0; index -= 1) {
    if (matchingProgress[index].stepIndex <= currentStep) {
      return matchingProgress[index]
    }
  }

  return matchingProgress[0] ?? progress.at(-1)
}

/** Detects a capacity binary search with an inner package feasibility pass. */
export function getCapacitySearchTraceCandidate(
  executionState: ExecutionState
): CapacitySearchTraceCandidate | undefined {
  return analyzeCapacityTrace(executionState)?.candidate
}

/** Resolves capacity-search state nearest to the current playback step. */
export function getCapacitySearchVisualizationState({
  executionState,
  variableName,
}: {
  executionState: ExecutionState
  variableName: string
}): CapacitySearchVisualizationState | undefined {
  const analysis = analyzeCapacityTrace(executionState)
  if (!analysis || analysis.candidate.name !== variableName) return undefined

  const bounds = findBoundsAtStep(
    executionState.steps,
    executionState.currentStep,
    analysis.candidate.stepIndex
  )
  if (!bounds) return undefined

  const progress = getProgressAtStep({
    steps: executionState.steps,
    progress: analysis.progress,
    currentStep: executionState.currentStep,
    mid: bounds.mid,
  })
  if (!progress) return undefined

  const isConverged = bounds.left === bounds.right
  const capacity = isConverged ? bounds.left : progress.capacity
  const currentIndex = isConverged
    ? analysis.data.length - 1
    : progress.currentIndex
  const packages = getCapacityPackages(analysis.data, capacity)
  const currentPackage = packages[currentIndex]
  const finalPackage = packages.at(-1)
  if (!currentPackage || !finalPackage) return undefined

  return {
    ...bounds,
    capacity,
    isConverged,
    totalWeight: analysis.totalWeight,
    targetDays: analysis.targetDays,
    currentIndex,
    currentWeight: currentPackage.weight,
    packages,
    requiredDays: currentPackage.day,
    currentLoad: currentPackage.load,
    canShip: finalPackage.day <= analysis.targetDays,
  }
}
