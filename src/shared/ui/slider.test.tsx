import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { Slider } from './slider'

describe('Slider', () => {
  it('uses secondary for the track and primary for the thumb accent', () => {
    render(
      <Slider
        aria-label="Playback Interval"
        value={50}
        onValueChange={vi.fn()}
      />
    )

    const slider = screen.getByRole('slider', { name: 'Playback Interval' })

    expect(slider).toHaveClass('pixel-slider', 'bg-secondary', 'accent-primary')
  })
})
