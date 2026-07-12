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
  it('shows the title, View View monitor, and tabs in order', () => {
    render(
      <MobileHeader
        mode="editor"
        onModeChange={noop}
        isVerificationDisabled={false}
        isRuntimeDisabled={false}
        viewViewAnimationSrc="/view-view-animation/thinking.gif"
      />
    )

    const title = screen.getByRole('img', { name: 'DSA ViewView' })
    const animation = screen.getByRole('img', { name: 'View View animation' })
    const firstTab = screen.getByRole('button', { name: 'Editor' })

    expect(
      title.compareDocumentPosition(animation) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      animation.compareDocumentPosition(firstTab) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
