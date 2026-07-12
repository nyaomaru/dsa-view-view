import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { VIEW_VIEW_MONITOR_INTRO_DURATION_MS } from '../model/use-view-view-animation'
import { ViewViewMonitor } from './view-view-monitor'

describe('ViewViewMonitor', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('horizontally flips the passing animation', () => {
    render(
      <ViewViewMonitor viewViewAnimationSrc="/view-view-animation/passing.gif" />
    )

    expect(screen.getByAltText('View View animation')).toHaveClass(
      'scale-x-[-1]'
    )
  })

  it('does not flip other animations', () => {
    render(
      <ViewViewMonitor viewViewAnimationSrc="/view-view-animation/normal.gif" />
    )

    expect(screen.getByAltText('View View animation')).not.toHaveClass(
      'scale-x-[-1]'
    )
  })

  it('plays the monitor transition when hiding and showing the screen', () => {
    vi.useFakeTimers()
    const { container } = render(
      <ViewViewMonitor viewViewAnimationSrc="/view-view-animation/nomal.gif" />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hide TV View' }))

    expect(screen.queryByAltText('View View animation')).not.toBeInTheDocument()
    expect(
      container.querySelector(
        'img[src="/view-view-animation/TV-moniter-off.gif"]'
      )
    ).toBeInTheDocument()
    expect(
      container.querySelector('img[src="/TV moniter.png"]')
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_MONITOR_INTRO_DURATION_MS)
    })

    expect(
      screen.getByRole('button', { name: 'Show TV View' })
    ).toBeInTheDocument()
    expect(
      container.querySelector('img[src="/TV moniter.png"]')
    ).toBeInTheDocument()
    expect(screen.queryByAltText('View View animation')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show TV View' }))

    expect(
      container.querySelector('img[src="/view-view-animation/TV-moniter.gif"]')
    ).toBeInTheDocument()
    expect(
      container.querySelector('img[src="/TV moniter.png"]')
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_MONITOR_INTRO_DURATION_MS)
    })

    expect(screen.getByAltText('View View animation')).toHaveAttribute(
      'src',
      '/view-view-animation/nomal.gif'
    )
  })
})
