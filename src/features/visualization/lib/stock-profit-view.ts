import type { ExecutionState } from '@/entities/execution'
import {
  isInteger,
  isNonEmptyNumericArray,
  isNumber,
} from '@/shared/lib/guards'

type StockProfitMode = 'single-transaction' | 'multiple-transactions'

type StockProfitProgress = {
  stepIndex: number
  currentIndex: number
  currentPrice: number
  profit: number
  buyIndex: number
  sellIndex: number
  minimumPrice?: number
  difference?: number
}

type ExpectedStockProfitProgress = Omit<StockProfitProgress, 'stepIndex'>
type NameTriple = readonly [string, string, string]

/** Variable mapping inferred from a stock-profit execution trace. */
export type StockProfitTraceCandidate = {
  /** Numeric price-array variable. */
  name: string
  /** First step containing a completed price update. */
  stepIndex: number
  /** Stock-profit strategy represented by the trace. */
  mode: StockProfitMode
  /** Variable holding accumulated or best profit. */
  profitName: string
  /** Loop index variable for adjacent-difference strategies. */
  indexName?: string
  /** Current price variable for for-of strategies. */
  priceName?: string
  /** Running minimum-price variable for one-transaction strategies. */
  minimumName?: string
  /** Adjacent price-difference variable for multi-transaction strategies. */
  differenceName?: string
}

/** Values displayed by the stock-profit visualization. */
export type StockProfitVisualizationState = {
  /** Numeric source prices. */
  data: number[]
  /** Stock-profit strategy represented by the trace. */
  mode: StockProfitMode
  /** Current price-array index. */
  currentIndex: number
  /** Price at the current index. */
  currentPrice: number
  /** Best or accumulated profit through the current index. */
  profit: number
  /** Buy index for the current best transaction or adjacent trade. */
  buyIndex: number
  /** Sell index for the current best transaction or adjacent trade. */
  sellIndex: number
  /** Running minimum price for one-transaction strategies. */
  minimumPrice?: number
  /** Current adjacent difference for multi-transaction strategies. */
  difference?: number
  /** Runtime variable names shown alongside semantic labels. */
  variableNames: Omit<StockProfitTraceCandidate, 'name' | 'stepIndex' | 'mode'>
}

type IndexedStockProfitCandidate = {
  candidate: StockProfitTraceCandidate
  data: number[]
  progress: StockProfitProgress[]
}

const analysisCache = new WeakMap<
  ExecutionState['steps'],
  IndexedStockProfitCandidate | null
>()

const priceNameHints = ['price', 'stock']
const profitNameHints = ['profit', 'gain']
const minimumNameHints = ['min', 'low', 'buy']
const indexNameHints = ['i', 'index', 'day']
const differenceNameHints = ['diff', 'change', 'delta']

function normalizedNameIncludes(name: string, hints: string[]): boolean {
  const normalizedName = name.toLowerCase().replaceAll(/[^a-z0-9]/g, '')
  return hints.some((hint) => normalizedName.includes(hint))
}

function getPriceSources(
  steps: ExecutionState['steps']
): Array<{ name: string; data: number[] }> {
  const firstVariableStep = steps.find(
    (step) => Object.keys(step.variables).length > 0
  )
  if (!firstVariableStep) return []

  return Object.entries(firstVariableStep.variables).flatMap(([name, value]) =>
    normalizedNameIncludes(name, priceNameHints) &&
    isNonEmptyNumericArray(value)
      ? [{ name, data: value.map(Number) }]
      : []
  )
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

function getSingleTransactionExpectedProgress(
  data: number[]
): ExpectedStockProfitProgress[] {
  let minimumPrice = Infinity
  let minimumIndex = 0
  let profit = 0
  let buyIndex = 0
  let sellIndex = 0

  return data.map((currentPrice, currentIndex) => {
    if (currentPrice < minimumPrice) {
      minimumPrice = currentPrice
      minimumIndex = currentIndex
    }

    const candidateProfit = currentPrice - minimumPrice
    if (candidateProfit > profit) {
      profit = candidateProfit
      buyIndex = minimumIndex
      sellIndex = currentIndex
    }

    return {
      currentIndex,
      currentPrice,
      minimumPrice,
      profit,
      buyIndex,
      sellIndex,
    }
  })
}

function getDistinctNameTriples(
  firstNames: string[],
  secondNames: string[],
  thirdNames: string[]
): NameTriple[] {
  const namePairs = firstNames.flatMap((firstName) =>
    secondNames.map((secondName) => [firstName, secondName] as const)
  )

  return namePairs
    .flatMap(([firstName, secondName]) =>
      thirdNames.map((thirdName) => [firstName, secondName, thirdName] as const)
    )
    .filter((names) => new Set(names).size === names.length)
}

function matchExpectedProgress(
  expectedProgress: ExpectedStockProfitProgress[],
  findStepIndex: (
    expected: ExpectedStockProfitProgress,
    progressIndex: number,
    previousStepIndex: number
  ) => number
): StockProfitProgress[] | undefined {
  const progress: StockProfitProgress[] = []
  let previousStepIndex = -1

  for (let index = 0; index < expectedProgress.length; index += 1) {
    const expected = expectedProgress[index]
    const stepIndex = findStepIndex(expected, index, previousStepIndex)
    if (stepIndex < 0) return undefined

    progress.push({ ...expected, stepIndex })
    previousStepIndex = stepIndex
  }

  return progress
}

function findSingleTransactionCandidate(
  steps: ExecutionState['steps'],
  source: { name: string; data: number[] },
  numericNames: string[]
): IndexedStockProfitCandidate | undefined {
  const loopDescription = `for (... of ${source.name})`
  const loopEntries = steps
    .map((step, stepIndex) => ({ step, stepIndex }))
    .filter(({ step }) => step.description === loopDescription)
  if (loopEntries.length !== source.data.length) return undefined

  const priceNames = numericNames.filter(
    (name) =>
      normalizedNameIncludes(name, priceNameHints) &&
      loopEntries.every(
        ({ step }, index) => step.variables[name] === source.data[index]
      )
  )
  const minimumNames = numericNames.filter((name) =>
    normalizedNameIncludes(name, minimumNameHints)
  )
  const profitNames = numericNames.filter((name) =>
    normalizedNameIncludes(name, profitNameHints)
  )
  const expectedProgress = getSingleTransactionExpectedProgress(source.data)
  const variableMappings = getDistinctNameTriples(
    priceNames,
    minimumNames,
    profitNames
  )

  for (const [priceName, minimumName, profitName] of variableMappings) {
    const progress = matchExpectedProgress(
      expectedProgress,
      (expected, index) => {
        const start = loopEntries[index].stepIndex
        const end = loopEntries[index + 1]?.stepIndex ?? steps.length

        return steps.findIndex(
          (step, stepIndex) =>
            stepIndex >= start &&
            stepIndex < end &&
            step.variables[priceName] === expected.currentPrice &&
            step.variables[minimumName] === expected.minimumPrice &&
            step.variables[profitName] === expected.profit
        )
      }
    )
    if (!progress) continue

    return {
      candidate: {
        name: source.name,
        stepIndex: progress[0].stepIndex,
        mode: 'single-transaction',
        profitName,
        priceName,
        minimumName,
      },
      data: source.data,
      progress,
    }
  }

  return undefined
}

function getMultipleTransactionExpectedProgress(
  data: number[]
): ExpectedStockProfitProgress[] {
  let profit = 0

  return data.slice(1).map((currentPrice, offset) => {
    const currentIndex = offset + 1
    const difference = currentPrice - data[currentIndex - 1]
    if (difference > 0) profit += difference

    return {
      currentIndex,
      currentPrice,
      difference,
      profit,
      buyIndex: currentIndex - 1,
      sellIndex: currentIndex,
    }
  })
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasSourceDifferenceEvidence({
  steps,
  sourceName,
  indexName,
  differenceName,
}: {
  steps: ExecutionState['steps']
  sourceName: string
  indexName: string
  differenceName: string
}): boolean {
  const escapedSourceName = escapeRegExp(sourceName)
  const escapedIndexName = escapeRegExp(indexName)
  const escapedDifferenceName = escapeRegExp(differenceName)
  const differenceAssignment = new RegExp(
    `^(?:(?:const|let|var))?${escapedDifferenceName}=`
  )
  const currentPriceAccess = new RegExp(
    `(?:^|[^a-zA-Z0-9_$])${escapedSourceName}\\[${escapedIndexName}\\]`
  )
  const previousPriceAccess = new RegExp(
    `(?:^|[^a-zA-Z0-9_$])${escapedSourceName}\\[${escapedIndexName}-1\\]`
  )

  return steps.some((step) => {
    const description = step.description.replaceAll(/\s/g, '')

    return (
      differenceAssignment.test(description) &&
      currentPriceAccess.test(description) &&
      previousPriceAccess.test(description)
    )
  })
}

function findMultipleTransactionCandidate(
  steps: ExecutionState['steps'],
  source: { name: string; data: number[] },
  numericNames: string[]
): IndexedStockProfitCandidate | undefined {
  if (source.data.length < 2) return undefined

  const indexNames = numericNames.filter(
    (name) =>
      normalizedNameIncludes(name, indexNameHints) &&
      source.data
        .slice(1)
        .every((_, offset) =>
          steps.some((step) => step.variables[name] === offset + 1)
        )
  )
  const differenceNames = numericNames.filter((name) =>
    normalizedNameIncludes(name, differenceNameHints)
  )
  const profitNames = numericNames.filter((name) =>
    normalizedNameIncludes(name, profitNameHints)
  )
  const expectedProgress = getMultipleTransactionExpectedProgress(source.data)
  const variableMappings = getDistinctNameTriples(
    indexNames,
    differenceNames,
    profitNames
  ).filter(([indexName, differenceName]) =>
    hasSourceDifferenceEvidence({
      steps,
      sourceName: source.name,
      indexName,
      differenceName,
    })
  )

  for (const [indexName, differenceName, profitName] of variableMappings) {
    const progress = matchExpectedProgress(
      expectedProgress,
      (expected, _index, previousStepIndex) =>
        steps.findIndex(
          (step, stepIndex) =>
            stepIndex > previousStepIndex &&
            step.variables[indexName] === expected.currentIndex &&
            step.variables[differenceName] === expected.difference &&
            step.variables[profitName] === expected.profit
        )
    )
    if (!progress) continue

    return {
      candidate: {
        name: source.name,
        stepIndex: progress[0].stepIndex,
        mode: 'multiple-transactions',
        profitName,
        indexName,
        differenceName,
      },
      data: source.data,
      progress,
    }
  }

  return undefined
}

function analyzeStockProfitTrace(
  executionState: ExecutionState
): IndexedStockProfitCandidate | undefined {
  const cached = analysisCache.get(executionState.steps)
  if (cached !== undefined) return cached ?? undefined

  const numericNames = getNumericVariableNames(executionState.steps)
  let indexedCandidate: IndexedStockProfitCandidate | undefined

  for (const source of getPriceSources(executionState.steps)) {
    indexedCandidate =
      findSingleTransactionCandidate(
        executionState.steps,
        source,
        numericNames
      ) ??
      findMultipleTransactionCandidate(
        executionState.steps,
        source,
        numericNames
      )
    if (indexedCandidate) break
  }

  analysisCache.set(executionState.steps, indexedCandidate ?? null)
  return indexedCandidate
}

function getProgressAtStep(
  progress: StockProfitProgress[],
  stepIndex: number
): StockProfitProgress | undefined {
  for (let index = progress.length - 1; index >= 0; index -= 1) {
    if (progress[index].stepIndex <= stepIndex) return progress[index]
  }

  return progress[0]
}

/** Detects a one-transaction or adjacent-gains stock-profit trace. */
export function getStockProfitTraceCandidate(
  executionState: ExecutionState
): StockProfitTraceCandidate | undefined {
  return analyzeStockProfitTrace(executionState)?.candidate
}

/** Resolves the stock-profit state nearest to the current playback step. */
export function getStockProfitVisualizationState({
  executionState,
  variableName,
}: {
  executionState: ExecutionState
  variableName: string
}): StockProfitVisualizationState | undefined {
  const analysis = analyzeStockProfitTrace(executionState)
  if (!analysis || analysis.candidate.name !== variableName) return undefined

  const requestedStepIndex = isInteger(executionState.currentStep)
    ? executionState.currentStep
    : analysis.candidate.stepIndex
  const progress = getProgressAtStep(analysis.progress, requestedStepIndex)
  if (!progress) return undefined

  const { candidate } = analysis
  return {
    data: analysis.data,
    mode: candidate.mode,
    currentIndex: progress.currentIndex,
    currentPrice: progress.currentPrice,
    profit: progress.profit,
    buyIndex: progress.buyIndex,
    sellIndex: progress.sellIndex,
    minimumPrice: progress.minimumPrice,
    difference: progress.difference,
    variableNames: {
      profitName: candidate.profitName,
      indexName: candidate.indexName,
      priceName: candidate.priceName,
      minimumName: candidate.minimumName,
      differenceName: candidate.differenceName,
    },
  }
}
