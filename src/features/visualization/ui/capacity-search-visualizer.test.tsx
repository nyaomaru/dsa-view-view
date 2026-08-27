import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import { CapacitySearchVisualizer } from './capacity-search-visualizer'

describe('CapacitySearchVisualizer', () => {
  it('shows capacity bounds, total weight, and the current package index', () => {
    render(
      <CapacitySearchVisualizer
        name="weights"
        state={{
          left: 10,
          right: 10,
          mid: 9,
          capacity: 10,
          isConverged: true,
          phase: 'complete',
          totalWeight: 15,
          targetDays: 2,
          currentIndex: 3,
          currentWeight: 4,
          packages: [
            { index: 0, weight: 1, day: 1, load: 1 },
            { index: 1, weight: 2, day: 1, load: 3 },
            { index: 2, weight: 3, day: 1, load: 6 },
            { index: 3, weight: 4, day: 1, load: 10 },
            { index: 4, weight: 5, day: 2, load: 5 },
          ],
          requiredDays: 1,
          currentLoad: 10,
          canShip: true,
        }}
      />
    )

    expect(screen.getByText('max weight → total weight (15)')).toBeVisible()
    expect(screen.getByText('result · capacity')).toBeVisible()
    expect(screen.queryByText('mid · capacity')).not.toBeInTheDocument()
    expect(screen.getByText('10 / 10')).toBeVisible()
    expect(screen.getByText('1 / 2')).toBeVisible()
    expect(screen.getByText('fits')).toBeVisible()
    expect(
      screen.getByRole('listitem', { current: 'step' })
    ).toHaveAccessibleName('Index 3: weight 4, day 1, current')
    expect(screen.getByText('weights[3] = 4 · day 1 load = 10')).toBeVisible()
  })

  it('shows a pending state before the first package iteration', () => {
    render(
      <CapacitySearchVisualizer
        name="weights"
        state={{
          left: 10,
          right: 55,
          mid: 32,
          capacity: 32,
          isConverged: false,
          phase: 'pending',
          totalWeight: 55,
          targetDays: 5,
          packages: [
            { index: 0, weight: 1, day: 1, load: 1 },
            { index: 1, weight: 2, day: 1, load: 3 },
          ],
          requiredDays: 0,
          currentLoad: 0,
          canShip: true,
        }}
      />
    )

    expect(screen.getByText('0 / 32')).toBeVisible()
    expect(screen.getByText('0 / 5')).toBeVisible()
    expect(screen.getByText('pending')).toBeVisible()
    expect(
      screen.queryByRole('listitem', { current: 'step' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Waiting for the first package iteration')
    ).toBeVisible()
  })
})
