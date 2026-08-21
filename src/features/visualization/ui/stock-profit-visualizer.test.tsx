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
    expect(screen.getByText('3 > 0 → add the gain')).toBeInTheDocument()
  })
})
