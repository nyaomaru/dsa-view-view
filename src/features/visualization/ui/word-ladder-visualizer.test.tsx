import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { WordLadderVisualizer } from './word-ladder-visualizer'

describe('WordLadderVisualizer', () => {
  it('shows the current word, queue, graph levels, and transitions', () => {
    render(
      <WordLadderVisualizer
        state={{
          beginWord: 'hit',
          endWord: 'cog',
          isTargetAvailable: true,
          currentWord: 'hot',
          currentDistance: 2,
          activePattern: 'h*t',
          queue: [{ word: 'dot', distance: 3 }],
          nodes: [
            {
              word: 'hit',
              level: 0,
              state: 'visited',
              isTarget: false,
            },
            {
              word: 'hot',
              level: 1,
              state: 'current',
              isTarget: false,
            },
            {
              word: 'cog',
              level: 2,
              state: 'unvisited',
              isTarget: true,
            },
          ],
          edges: [{ from: 'hit', to: 'hot', isActive: true }],
        }}
      />
    )

    expect(screen.getByText('hot', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('dot (3)')).toBeInTheDocument()
    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.getByText('hit ↔ hot')).toBeInTheDocument()
    expect(screen.getByLabelText('cog: unvisited, target')).not.toHaveClass(
      'ring-2'
    )
    expect(screen.queryByText('Filled: current')).not.toBeInTheDocument()
  })
})
