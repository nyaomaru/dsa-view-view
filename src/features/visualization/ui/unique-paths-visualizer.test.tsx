import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { UniquePathsVisualizer } from './unique-paths-visualizer'

const data = [
  [1, 1, 1],
  [1, 2, 3],
]

describe('UniquePathsVisualizer', () => {
  it('shows the recurrence and labels its dependencies', () => {
    render(
      <UniquePathsVisualizer
        state={{ data, active: { row: 1, col: 2 }, complete: false }}
      />
    )
    expect(screen.getByText('dp[1][2] = 1 + 2 = 3')).toBeInTheDocument()
    expect(screen.getByLabelText('dp[0][2] = 1, Above ↓')).toBeInTheDocument()
    expect(screen.getByLabelText('dp[1][1] = 2, Left →')).toBeInTheDocument()
    expect(screen.getByLabelText('dp[1][2] = 3, Current')).toBeInTheDocument()
  })

  it('explains base cases and displays the completed count', () => {
    const { rerender } = render(
      <UniquePathsVisualizer
        state={{ data: [[1]], active: { row: 0, col: 0 }, complete: false }}
      />
    )
    expect(screen.getByText(/only one path/)).toBeInTheDocument()
    rerender(<UniquePathsVisualizer state={{ data, complete: true }} />)
    expect(screen.getByText('Total unique paths: 3')).toBeInTheDocument()
  })
})
