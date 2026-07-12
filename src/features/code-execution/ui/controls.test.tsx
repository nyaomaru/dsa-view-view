import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { Controls } from './controls'

const defaultProps = {
  isRunning: false,
  isComplete: false,
  currentStep: 0,
  playbackInterval: 30,
  onPlaybackIntervalChange: vi.fn(),
  onStepForward: vi.fn(),
  onStepBackward: vi.fn(),
  onRunAll: vi.fn(),
  onPause: vi.fn(),
  onSkipToEnd: vi.fn(),
  onResetToStart: vi.fn(),
}

describe('Controls', () => {
  it('uses secondary styling for the playback interval value', () => {
    render(<Controls {...defaultProps} />)

    expect(screen.getByText('30ms')).toHaveClass(
      'bg-secondary',
      'text-secondary-foreground'
    )
  })
})
