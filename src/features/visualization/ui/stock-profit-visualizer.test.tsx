import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { StockProfitVisualizer } from './stock-profit-visualizer'

describe('StockProfitVisualizer', () => {
  it('shows one-transaction prices and best trade', () => {
    render(
      <StockProfitVisualizer
        name="prices"
        state={{
          data: [7, 1, 5, 3, 6, 4],
          mode: 'single-transaction',
          currentIndex: 4,
          currentPrice: 6,
          profit: 5,
          buyIndex: 1,
          sellIndex: 4,
          minimumPrice: 1,
          variableNames: {
            profitName: 'maxProfit',
            priceName: 'price',
            minimumName: 'min',
          },
        }}
      />
    )

    expect(screen.getByText('Best profit')).toBeInTheDocument()
    expect(screen.getByText('maxProfit')).toBeInTheDocument()
    expect(screen.getByText('min')).toBeInTheDocument()
    expect(screen.getByLabelText('Day 4: price 6, current')).toHaveAttribute(
      'aria-current',
      'step'
    )
    expect(
      screen.getByLabelText('Day 1: price 1, buy').querySelector('div')
    ).toHaveClass('border-primary/40', 'bg-primary/10')
    expect(
      screen.getByText('buy day 1 · sell day 4 · profit 5')
    ).toBeInTheDocument()
  })

  it.each([
    { label: 'flat', data: [5, 5], currentPrice: 5, minimumPrice: 5 },
    { label: 'decreasing', data: [5, 3], currentPrice: 3, minimumPrice: 3 },
  ])('reports no trade for $label single-transaction prices', (state) => {
    render(
      <StockProfitVisualizer
        name="prices"
        state={{
          data: state.data,
          mode: 'single-transaction',
          currentIndex: 1,
          currentPrice: state.currentPrice,
          profit: 0,
          buyIndex: 0,
          sellIndex: 0,
          minimumPrice: state.minimumPrice,
          variableNames: {
            profitName: 'maxProfit',
            priceName: 'price',
            minimumName: 'min',
          },
        }}
      />
    )

    expect(screen.getByText('no profitable trade')).toBeInTheDocument()
    expect(screen.queryByText(/buy day/)).not.toBeInTheDocument()
    expect(
      screen.getByLabelText(`Day 0: price ${state.data[0]}, processed`)
    ).toBeInTheDocument()
  })

  it('shows adjacent change and total profit for repeated transactions', () => {
    render(
      <StockProfitVisualizer
        name="prices"
        state={{
          data: [7, 1, 5, 3, 6, 4],
          mode: 'multiple-transactions',
          currentIndex: 4,
          currentPrice: 6,
          profit: 7,
          buyIndex: 3,
          sellIndex: 4,
          difference: 3,
          variableNames: {
            profitName: 'profit',
            indexName: 'i',
            differenceName: 'diff',
          },
        }}
      />
    )

    expect(screen.getByText('Daily change')).toBeInTheDocument()
    expect(screen.getByText('Total profit')).toBeInTheDocument()
    expect(screen.getByText('diff')).toBeInTheDocument()
    expect(screen.getByLabelText('Day 3: price 3, buy')).toBeInTheDocument()
    expect(screen.getByText('3 > 0 → add the gain')).toBeInTheDocument()
  })

  it.each([
    {
      label: 'flat',
      data: [5, 5],
      currentIndex: 1,
      currentPrice: 5,
      profit: 0,
      difference: 0,
    },
    {
      label: 'falling after an earlier gain',
      data: [1, 5, 3],
      currentIndex: 2,
      currentPrice: 3,
      profit: 4,
      difference: -2,
    },
  ])('does not label a skipped $label pair as a buy', (state) => {
    const buyIndex = state.currentIndex - 1

    render(
      <StockProfitVisualizer
        name="prices"
        state={{
          ...state,
          mode: 'multiple-transactions',
          buyIndex,
          sellIndex: state.currentIndex,
          variableNames: {
            profitName: 'profit',
            indexName: 'i',
            differenceName: 'diff',
          },
        }}
      />
    )

    expect(
      screen.getByLabelText(
        `Day ${buyIndex}: price ${state.data[buyIndex]}, processed`
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('buy')).not.toBeInTheDocument()
  })
})
