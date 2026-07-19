import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { ExpressionVisualizer } from './expression-visualizer'

describe('ExpressionVisualizer', () => {
  it('shows the cursor, calculator values, and top sign context', () => {
    render(
      <ExpressionVisualizer
        state={{
          expression: '1+(2)',
          index: 2,
          currentChar: '(',
          result: 1,
          currentNumber: 0,
          sign: -1,
          signStack: [1, -1],
          action: 'Entering parentheses',
        }}
      />
    )

    expect(
      screen.getByLabelText('Current character ( at index 2')
    ).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Entering parentheses')).toBeInTheDocument()

    const stack = screen.getByLabelText('Parenthesis sign stack')
    expect(within(stack).getByText('Top')).toBeInTheDocument()
    expect(within(stack).getByText('-1')).toBeInTheDocument()
    expect(
      within(stack).getByLabelText('-1 sign context, top')
    ).toBeInTheDocument()
    expect(
      within(stack).getByLabelText('+1 sign context, root')
    ).toBeInTheDocument()
    expect(screen.getByText('Pending total')).toBeInTheDocument()
  })
})
