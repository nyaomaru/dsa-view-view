import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { ListGraphVisualizer } from './list-graph-visualizer'

describe('ListGraphVisualizer', () => {
  it('renders null pointer variables as a graph state', () => {
    render(<ListGraphVisualizer data={null} name="fast" />)

    expect(screen.getByText('fast List Graph')).toBeInTheDocument()
    expect(screen.getByText('null')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'fast linked list graph' })
    ).toBeInTheDocument()
  })

  it('centers a single list node in the SVG viewport', () => {
    render(<ListGraphVisualizer data={{ val: 1, next: null }} name="head" />)

    expect(screen.getByText('1').closest('g')).toHaveAttribute(
      'transform',
      'translate(4 3)'
    )
  })
})
