import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { JumpGameVisualizer } from './jump-game-visualizer'

describe('JumpGameVisualizer', () => {
  it('shows the active scan, jump boundary, and farthest reach', () => {
    render(
      <JumpGameVisualizer
        name="nums"
        state={{
          data: [2, 3, 1, 1, 4],
          currentIndex: 2,
          jumps: 2,
          currentEnd: 4,
          farthest: 4,
          variableNames: {
            indexName: 'i',
            jumpsName: 'jumps',
            currentEndName: 'currentEnd',
            farthestName: 'farthest',
          },
        }}
      />
    )

    expect(screen.getByText('Jumps committed')).toBeInTheDocument()
    expect(screen.getByText('Farthest reachable')).toBeInTheDocument()
    expect(screen.getByText('farthest')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Index 2: jump length 1, current')
    ).toHaveAttribute('aria-current', 'step')
    expect(
      screen.getByLabelText('Index 4: jump length 4, boundary')
    ).toBeInTheDocument()
    expect(
      screen.getByText('nums[2] = 1 → reachable through 4; current boundary = 4')
    ).toBeInTheDocument()
  })
})
