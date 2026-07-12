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

  it('uses large text and distinct tints for short grid values', () => {
    render(<MatrixVisualizer data={[[0, 1, '2']]} name="grid" />)

    const zeroCell = screen.getByText('0').parentElement
    const oneCell = screen.getByText('1').parentElement
    const twoCell = screen.getByText('2').parentElement

    expect(screen.getByText('0')).toHaveClass('text-4xl')
    expect(screen.getByText('1')).toHaveClass('text-4xl')
    expect(screen.getByText('2')).toHaveClass('text-4xl')
    expect(zeroCell?.className).not.toBe(oneCell?.className)
    expect(oneCell?.className).not.toBe(twoCell?.className)
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

    expect(screen.getByText('#').parentElement).toHaveClass(
      'border-primary',
      'ring-2'
    )
    expect(screen.getByText('A').parentElement).toHaveClass('border-border')
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
