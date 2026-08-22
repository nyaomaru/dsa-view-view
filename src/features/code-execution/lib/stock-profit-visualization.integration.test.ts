import { describe, expect, it } from 'vite-plus/test'
import {
  getStockProfitTraceCandidate,
  getStockProfitVisualizationState,
} from '@/features/visualization/lib/stock-profit-view'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { executeCode } from './runner'

const input = { prices: [7, 1, 5, 3, 6, 4] }

describe('Stock-profit visualization integration', () => {
  it('visualizes the running minimum and best single-transaction profit', () => {
    const state = executeCode(
      `
function maxProfit(prices: number[]): number {
  let min = Infinity
  let maxProfit = 0

  for (const price of prices) {
    if (price < min) {
      min = price
    }
    maxProfit = Math.max(maxProfit, price - min)
  }

  return maxProfit
}
`,
      input,
      'maxProfit'
    )
    const currentStep = state.steps.findIndex(
      (step) =>
        step.variables.price === 6 &&
        step.variables.min === 1 &&
        step.variables.maxProfit === 5
    )
    const candidate = getStockProfitTraceCandidate(state)
    const view = getStockProfitVisualizationState({
      executionState: { ...state, currentStep },
      variableName: 'prices',
    })
    const detection = detectVisualizationState(state)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(5)
    expect(currentStep).toBeGreaterThanOrEqual(0)
    expect(candidate).toMatchObject({
      name: 'prices',
      mode: 'single-transaction',
      priceName: 'price',
      minimumName: 'min',
      profitName: 'maxProfit',
    })
    expect(view).toMatchObject({
      mode: 'single-transaction',
      currentIndex: 4,
      currentPrice: 6,
      minimumPrice: 1,
      profit: 5,
      buyIndex: 1,
      sellIndex: 4,
    })
    expect(detection).toMatchObject({
      primaryStockProfitArrayName: 'prices',
      primaryStockProfitStepIndex: candidate?.stepIndex,
    })
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'stock-profit',
      targetVariable: 'prices',
      targetStepIndex: candidate?.stepIndex,
    })
  })

  it('visualizes each adjacent gain and the accumulated profit', () => {
    const state = executeCode(
      `
function maxProfit(prices: number[]): number {
  const n = prices.length
  if (n === 0) return 0

  let profit = 0
  for (let i = 1; i < n; i++) {
    const diff = prices[i] - prices[i - 1]

    if (diff > 0) {
      profit += diff
    }
  }

  return profit
}
`,
      input,
      'maxProfit'
    )
    const currentStep = state.steps.findIndex(
      (step) =>
        step.variables.i === 4 &&
        step.variables.diff === 3 &&
        step.variables.profit === 7
    )
    const candidate = getStockProfitTraceCandidate(state)
    const view = getStockProfitVisualizationState({
      executionState: { ...state, currentStep },
      variableName: 'prices',
    })

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(7)
    expect(currentStep).toBeGreaterThanOrEqual(0)
    expect(candidate).toMatchObject({
      name: 'prices',
      mode: 'multiple-transactions',
      indexName: 'i',
      differenceName: 'diff',
      profitName: 'profit',
    })
    expect(view).toMatchObject({
      mode: 'multiple-transactions',
      currentIndex: 4,
      currentPrice: 6,
      difference: 3,
      profit: 7,
      buyIndex: 3,
      sellIndex: 4,
    })
    expect(detectVisualizationState(state)).toMatchObject({
      primaryStockProfitArrayName: 'prices',
      primaryStockProfitStepIndex: candidate?.stepIndex,
    })
  })

  it('ties matching adjacent deltas to the price array read by the loop', () => {
    const shiftedPrices = input.prices.map((price) => price + 10)
    const state = executeCode(
      `
function maxProfit(
  shiftedPrices: number[],
  prices: number[]
): number {
  const n = prices.length
  let profit = 0

  for (let i = 1; i < n; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) profit += diff
  }

  return profit
}
`,
      { shiftedPrices, prices: input.prices },
      'maxProfit'
    )
    const candidate = getStockProfitTraceCandidate(state)
    const view = getStockProfitVisualizationState({
      executionState: state,
      variableName: 'prices',
    })

    expect(candidate).toMatchObject({
      name: 'prices',
      mode: 'multiple-transactions',
    })
    expect(view?.data).toEqual(input.prices)
    expect(detectVisualizationState(state).primaryStockProfitArrayName).toBe(
      'prices'
    )
  })

  it('does not classify unrelated price summaries as stock-profit traces', () => {
    const state = executeCode(
      `
function summarizePrices(prices: number[]): number {
  let min = Infinity
  let profit = 0

  for (const price of prices) {
    min = Math.min(min, price)
    profit += price
  }

  return profit - min
}
`,
      input,
      'summarizePrices'
    )

    expect(getStockProfitTraceCandidate(state)).toBeUndefined()
    expect(
      detectVisualizationState(state).primaryStockProfitArrayName
    ).toBeUndefined()
  })
})
