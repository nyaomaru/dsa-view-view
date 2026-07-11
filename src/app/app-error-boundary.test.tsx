import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { AppErrorBoundary } from './app-error-boundary'

const ThrowingChild = () => {
  throw new Error('render failed')
}

describe('AppErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a short fallback when rendering fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <ThrowingChild />
      </AppErrorBoundary>
    )

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Reload the app and try the action again.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  it('reloads the page from the fallback action', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()

    render(
      <AppErrorBoundary onReload={reload}>
        <ThrowingChild />
      </AppErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
