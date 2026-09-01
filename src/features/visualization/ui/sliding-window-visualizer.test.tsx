import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { SlidingWindowVisualizer } from './sliding-window-visualizer'

describe('SlidingWindowVisualizer', () => {
  it('shows half-open window state through the end boundary', () => {
    render(
      <SlidingWindowVisualizer
        data="abc"
        name="s"
        windowState={{
          left: 0,
          right: 3,
          rangeMode: 'half-open',
          windowSize: 3,
          setValues: ['a', 'b', 'c'],
          best: 3,
        }}
      />
    )

    expect(screen.getByText('range: [0, 3)')).toBeInTheDocument()
    expect(screen.getByText('size: 3')).toBeInTheDocument()
    expect(screen.getByText('set: {a, b, c}')).toBeInTheDocument()
    expect(screen.getByText('best: 3')).toBeInTheDocument()
    expect(screen.getByLabelText('End boundary')).toHaveTextContent('∅')
    expect(screen.getByText('R')).toBeInTheDocument()
  })
})
