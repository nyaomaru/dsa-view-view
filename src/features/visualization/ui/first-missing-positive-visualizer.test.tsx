import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { FirstMissingPositiveVisualizer } from './first-missing-positive-visualizer'

describe('FirstMissingPositiveVisualizer', () => {
  it('marks the current index, target index, and correctly placed values', () => {
    render(
      <FirstMissingPositiveVisualizer
        name="nums"
        state={{ data: [3, 4, -1, 1], n: 4, index: 0, targetIndex: 2 }}
      />
    )

    expect(
      screen.getByLabelText('Index 0: value 3, current')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Index 2: value -1, target')
    ).toBeInTheDocument()
    expect(screen.getByText('targetIndex: 2')).toBeInTheDocument()
  })
})
