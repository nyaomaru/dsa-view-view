import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { AppHeader, MobileHeader } from './header'

const noop = () => {}

describe('AppHeader', () => {
  it('shows the desktop title copy', () => {
    render(<AppHeader />)

    const title = screen.getByRole('img', { name: 'DSA ViewView' })
    const description = screen.getByText(
      'Write, validate, and visualize your algorithms step-by-step. Support for TypeScript with real-time feedback.'
    )

    expect(
      title.compareDocumentPosition(description) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})

describe('MobileHeader', () => {
  it('shows the View View monitor above the tabs without the logo', () => {
    render(
      <MobileHeader
        mode="editor"
        onModeChange={noop}
        isVerificationDisabled={false}
        isRuntimeDisabled={false}
        viewViewAnimationSrc="/view-view-animation/thinking.gif"
      />
    )

    const animation = screen.getByRole('img', { name: 'View View animation' })
    const firstTab = screen.getByRole('button', { name: 'Editor' })

    expect(
      screen.queryByRole('img', { name: 'DSA ViewView' })
    ).not.toBeInTheDocument()
    expect(
      animation.compareDocumentPosition(firstTab) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
