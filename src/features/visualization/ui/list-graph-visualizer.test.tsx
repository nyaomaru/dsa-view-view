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
})
