import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { MaxSubarrayVisualizer } from './max-subarray-visualizer'

describe('MaxSubarrayVisualizer', () => {
  it('shows the current element and both Kadane accumulators', () => {
    render(
      <MaxSubarrayVisualizer
        name="nums"
        state={{
          data: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
          currentIndex: 4,
          currentValue: -1,
          maxEndingHere: 3,
          maxSoFar: 4,
          variableNames: {
            indexName: 'position',
            endingName: 'endingAtPosition',
            bestName: 'bestSum',
          },
        }}
      />
    )

    expect(
      screen.queryByRole('heading', { name: 'Maximum Subarray: nums' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('position')).toBeInTheDocument()
    expect(screen.getByText('nums[position]')).toBeInTheDocument()
    expect(screen.getAllByText('endingAtPosition')).not.toHaveLength(0)
    expect(screen.getAllByText('bestSum')).not.toHaveLength(0)
    expect(screen.getByLabelText('Index 4: -1, current')).toHaveAttribute(
      'aria-current',
      'step'
    )
    expect(screen.getByLabelText('Index 3: 4, processed')).toBeInTheDocument()
    expect(screen.getByLabelText('Index 5: 2, pending')).toBeInTheDocument()
  })
})
