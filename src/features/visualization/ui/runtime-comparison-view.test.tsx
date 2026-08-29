import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { RuntimeComparisonView } from './runtime-comparison-view'

describe('RuntimeComparisonView', () => {
  it('keeps a stable placeholder before the first comparison', () => {
    render(<RuntimeComparisonView />)

    const view = screen.getByLabelText('Runtime comparison')

    expect(within(view).getByText('Waiting')).toBeInTheDocument()
    expect(
      within(view).getByText('No comparison evaluated yet.')
    ).toBeInTheDocument()
  })

  it('renders explicit undefined operands and a true result', () => {
    render(
      <RuntimeComparisonView
        comparison={{
          left: { expression: 'stack.pop()', value: undefined },
          operator: '!==',
          right: { expression: 'pairs.get(char)', value: '(' },
          result: true,
        }}
      />
    )

    const view = screen.getByLabelText('Runtime comparison')
    const left = within(view).getByLabelText('Left comparison operand')
    const right = within(view).getByLabelText('Right comparison operand')

    expect(within(left).getByText('stack.pop()')).toBeInTheDocument()
    expect(within(left).getByText('undefined')).toBeInTheDocument()
    expect(within(view).getByText('!==')).toBeInTheDocument()
    expect(within(right).getByText('pairs.get(char)')).toBeInTheDocument()
    expect(within(right).getByText('"("')).toBeInTheDocument()
    expect(within(view).getByText('true')).toBeInTheDocument()
  })
})
