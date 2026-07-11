import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { EditorPanel } from './editor-panel'
import { AppHeader } from '@/widgets/header'

vi.mock('@/features/code-editing/code-editor', () => {
  return {
    CodeEditor: () => <textarea aria-label="Code Editor" />,
  }
})

const noop = () => {}

describe('EditorPanel', () => {
  it('keeps the share button in the header and run-demo flex area', async () => {
    render(
      <EditorPanel
        header={<AppHeader />}
        sourceCode=""
        editorLanguage="typescript"
        onEditorChange={noop}
        onRunDemo={noop}
        onCreateShareUrl={() => Promise.resolve('https://example.test/#s=abc')}
        onValidate={noop}
      />
    )

    const title = screen.getByRole('img', { name: 'DSA ViewView' })
    const runDemoButton = screen.getByRole('button', { name: 'Run demo' })
    const [mobileShareButton, desktopShareButton] = screen.getAllByRole(
      'button',
      { name: 'Open link menu' }
    )

    expect(title.closest('.mb-4')).toBe(runDemoButton.closest('.mb-4'))
    expect(mobileShareButton.closest('.mb-4')).toBe(
      runDemoButton.closest('.mb-4')
    )
    expect(desktopShareButton.closest('.mb-4')).toBe(
      runDemoButton.closest('.mb-4')
    )
    expect(runDemoButton).toHaveClass('flex-1', 'lg:flex-none')
    expect(mobileShareButton).toHaveClass('h-11', 'w-[8.5rem]', 'lg:hidden')
    expect(desktopShareButton).toHaveClass('h-20', 'max-w-[18rem]')
  })
})
