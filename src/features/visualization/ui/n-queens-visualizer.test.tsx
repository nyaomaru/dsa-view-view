import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { NQueensVisualizer } from './n-queens-visualizer'

describe('NQueensVisualizer', () => {
  it('shows a chessboard with the current queen placements', () => {
    render(
      <NQueensVisualizer
        state={{
          size: 4,
          board: [
            [false, true, false, false],
            [false, false, false, true],
            [true, false, false, false],
            [false, false, true, false],
          ],
          currentRow: 3,
          currentColumn: 2,
          placedQueens: 4,
          solutionCount: 2,
        }}
      />
    )

    expect(screen.getByLabelText('4 by 4 chessboard')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/Queen at row/)).toHaveLength(4)
    expect(screen.getByText('solutions: 2')).toBeInTheDocument()
  })
})
