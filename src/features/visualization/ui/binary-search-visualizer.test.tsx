import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { BinarySearchVisualizer } from './binary-search-visualizer'

describe('BinarySearchVisualizer', () => {
  it('excludes the right boundary from half-open search ranges', () => {
    render(
      <BinarySearchVisualizer
        data={[1, 3, 5, 7, 9, 11]}
        name="values"
        indexState={{ left: 1, right: 4, mid: 2 }}
        rangeMode="half-open"
      />
    )

    expect(screen.getByText('right (exclusive): 4')).toBeVisible()
    expect(screen.getByLabelText('Index 3: value 7, in range')).toBeVisible()
    expect(
      screen.getByLabelText('Index 4: value 9, out of range')
    ).toBeVisible()
  })

  it('shows an empty range when half-open bounds converge', () => {
    render(
      <BinarySearchVisualizer
        data={[1, 3, 5, 7, 9, 11]}
        name="values"
        indexState={{ left: 4, right: 4, mid: 3 }}
        rangeMode="half-open"
      />
    )

    expect(
      screen.getByLabelText('Index 4: value 9, out of range')
    ).toBeVisible()
  })
})
