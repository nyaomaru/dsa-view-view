import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { AreaVisualizer } from './area-visualizer'

describe('AreaVisualizer histogram mode', () => {
  it('shows the monotonic stack and active rectangle', () => {
    render(
      <AreaVisualizer
        data={[2, 1, 5, 6, 2, 3, 0]}
        name="hs"
        areaState={{
          mode: 'histogram',
          currentIndex: 4,
          stackIndices: [1],
          bestArea: 10,
          rectangle: {
            poppedIndex: 2,
            leftIndex: 2,
            rightIndex: 3,
            height: 5,
            width: 2,
            area: 10,
          },
        }}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Rectangle Area View: hs' })
    ).toBeInTheDocument()
    expect(screen.getByText('i=4')).toBeInTheDocument()
    expect(screen.getByText('stack=[1]')).toBeInTheDocument()
    expect(screen.getByText('mid=2')).toBeInTheDocument()
    expect(screen.getByText('width=2')).toBeInTheDocument()
    expect(screen.getByText('area=10')).toBeInTheDocument()
    expect(screen.getByText('best=10')).toBeInTheDocument()
    expect(
      screen.getByLabelText(
        'Current rectangle: indexes 2 through 3, height 5, area 10'
      )
    ).toBeInTheDocument()
  })
})
