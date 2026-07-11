import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { MatrixVisualizer } from './matrix-visualizer'

describe('MatrixVisualizer', () => {
  it('wraps long string values inside matrix cells', () => {
    render(
      <MatrixVisualizer
        data={[['John', 'johnsmith@mail.com', 'john_newyork@mail.com']]}
        name="accounts"
      />
    )

    expect(screen.getByText('john_newyork@mail.com')).toHaveClass(
      'break-all',
      'whitespace-normal',
      'max-w-full'
    )
  })

  it('keeps large text styling for numeric cells', () => {
    render(<MatrixVisualizer data={[[42]]} name="matrix" />)

    expect(screen.getByText('42')).toHaveClass('text-4xl')
  })

  it('tints cells whose values changed from the previous matrix', () => {
    render(
      <MatrixVisualizer
        data={[
          ['A', '#'],
          ['C', 'D'],
        ]}
        previousData={[
          ['A', 'B'],
          ['C', 'D'],
        ]}
        name="board"
      />
    )

    expect(screen.getByText('#').parentElement).toHaveClass('bg-primary/10')
    expect(screen.getByText('A').parentElement).toHaveClass('bg-background')
  })

  it('keeps wide matrices scrollable from the left edge', () => {
    render(
      <MatrixVisualizer
        data={[
          [1, 1, 1, 1, 1, 1, 1],
          [1, 0, 0, 0, 0, 0, 0],
          [1, 0, 0, 0, 0, 0, 0],
        ]}
        name="dp"
      />
    )

    const scrollContainer =
      screen.getByText('3 × 7 Matrix').parentElement?.nextElementSibling
    const grid = scrollContainer?.firstElementChild

    expect(scrollContainer).toHaveClass('w-full', 'min-w-0', 'overflow-x-auto')
    expect(grid).toHaveClass('mx-auto', 'grid')
    expect(grid).not.toHaveClass('overflow-auto')
  })
})
