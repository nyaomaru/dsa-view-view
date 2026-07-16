import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { EditorPanel } from './editor-panel'
import { AppHeader } from '@/widgets/header'

const { prepareCodeEditor } = vi.hoisted(() => ({
  prepareCodeEditor: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/features/code-editing/code-editor', () => {
  return {
    prepareCodeEditor,
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
    const githubLink = screen.getByRole('link', {
      name: 'Open GitHub repository',
    })
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
    expect(githubLink.closest('.mb-4')).toBe(runDemoButton.closest('.mb-4'))
    expect(
      runDemoButton.compareDocumentPosition(githubLink) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/nyaomaru/dsa-view-view'
    )
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noreferrer')
    expect(githubLink.querySelector('img')).toHaveAttribute(
      'src',
      '/sns/github.svg'
    )
    expect(runDemoButton).toHaveClass('flex-1', 'lg:flex-none')
    expect(githubLink).toHaveClass('h-11', 'w-11', 'flex-none')
    expect(mobileShareButton).toHaveClass('h-11', 'w-[8.5rem]', 'lg:hidden')
    expect(desktopShareButton).toHaveClass('h-20', 'max-w-[18rem]')
    await waitFor(() => expect(prepareCodeEditor).toHaveBeenCalledOnce())
  })
})
