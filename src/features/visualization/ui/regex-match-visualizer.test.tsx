import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { RegexMatchVisualizer } from './regex-match-visualizer'

describe('RegexMatchVisualizer', () => {
  it('caps the rendered grid for long inputs', () => {
    render(
      <RegexMatchVisualizer
        state={{
          source: 'a'.repeat(10_000),
          pattern: 'b'.repeat(10_000),
          current: { i: 0, j: 0 },
          visited: new Set(['0,0']),
        }}
      />
    )

    expect(screen.getByText(/keep the grid responsive/)).toBeInTheDocument()
    expect(document.querySelectorAll('[data-regex-match-cell]')).toHaveLength(
      400
    )
  })
})
