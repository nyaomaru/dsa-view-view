import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { ShareButton } from './share-button'

describe('ShareButton', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows copied state on the button after copying the share link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(
      <ShareButton
        createShareUrl={() => Promise.resolve('https://example.test/#s=abc')}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open link menu' }))

    expect(
      await screen.findByDisplayValue('https://example.test/#s=abc')
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'X' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'BlueSky' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'LinkedIn' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute(
      'href',
      'https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.test%2F%23s%3Dabc'
    )
    expect(screen.getByRole('link', { name: 'BlueSky' })).toHaveAttribute(
      'href',
      'https://bsky.app/intent/compose?text=https%3A%2F%2Fexample.test%2F%23s%3Dabc'
    )
    expect(screen.getByRole('button', { name: 'LinkedIn' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.test/#s=abc')
    })

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(screen.queryByText('Link copied')).not.toBeInTheDocument()
  })

  it('copies the link before opening LinkedIn sharing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const popup = {
      opener: {},
      location: { href: '' },
    }
    const open = vi.spyOn(window, 'open').mockReturnValue(popup as Window)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(
      <ShareButton
        createShareUrl={() => Promise.resolve('https://example.test/#s=abc')}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open link menu' }))

    expect(
      await screen.findByDisplayValue('https://example.test/#s=abc')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'LinkedIn' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.test/#s=abc')
    })
    expect(open).toHaveBeenCalledWith('', '_blank')
    expect(popup.opener).toBeNull()
    expect(popup.location.href).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.test%2F%23s%3Dabc'
    )
    expect(
      screen.getByText('Link copied. Paste it into your LinkedIn post.')
    ).toBeInTheDocument()
  })

  it('uses the share button image as the trigger', () => {
    render(
      <ShareButton
        createShareUrl={() => Promise.resolve('https://example.test/#s=abc')}
      />
    )

    const trigger = screen.getByRole('button', {
      name: 'Open link menu',
    })
    const images = trigger.querySelectorAll('img')

    expect(images[0]).toHaveAttribute(
      'src',
      '/DSA%20view%20view%20share%20button.png'
    )
    expect(images[1]).toHaveAttribute(
      'src',
      '/DSA%20view%20view%20share%20button%20hover.png'
    )
    expect(images[0]).toHaveClass('h-full', 'w-full', 'object-contain')
    expect(images[1]).toHaveClass('h-full', 'w-full', 'object-contain')
  })
})
