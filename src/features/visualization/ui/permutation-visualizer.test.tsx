import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { PermutationVisualizer } from './permutation-visualizer'

describe('PermutationVisualizer', () => {
  it('shows factoradic blocks and the selected candidate', () => {
    render(
      <PermutationVisualizer
        state={{
          numbers: [1, 2, 3, 4],
          factorial: [1, 1, 2, 6, 24],
          remain: 4,
          blockSize: 6,
          index: 1,
          rank: 8,
          result: '',
          selectionIsCommitted: false,
        }}
      />
    )

    expect(screen.getByText('Block size')).toBeInTheDocument()
    expect(
      screen.getByText('Candidate pool before this selection')
    ).toBeInTheDocument()
    expect(screen.getByText('3! = 6')).toBeInTheDocument()
    expect(screen.getByText('Zero-based rank')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Candidate 2, index 1, selected')
    ).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('[6–11]')).toBeInTheDocument()
    expect(
      screen.getByText('index = ⌊8 / 6⌋ = 1; selected block = [6–11]')
    ).toBeInTheDocument()
  })
})
