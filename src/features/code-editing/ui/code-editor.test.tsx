import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

const { editorOptionsSpy } = vi.hoisted(() => ({
  editorOptionsSpy: vi.fn(),
}))

vi.mock('@monaco-editor/react', () => ({
  default: ({ options }: { options: Record<string, unknown> }) => {
    editorOptionsSpy(options)
    return <div aria-label="Rich Code Editor" />
  },
}))

vi.mock('../lib/configure-monaco', () => ({
  configureMonaco: vi.fn(),
  prepareMonaco: vi.fn(),
}))

import { CodeEditor } from './code-editor'

describe('CodeEditor', () => {
  it('renders overflow widgets outside clipping editor containers', async () => {
    const { unmount } = render(
      <CodeEditor value="const value = 1" onChange={vi.fn()} />
    )

    await waitFor(() => expect(editorOptionsSpy).toHaveBeenCalled())

    const options = editorOptionsSpy.mock.lastCall?.[0]
    const overflowWidgetsDomNode = options?.overflowWidgetsDomNode

    expect(overflowWidgetsDomNode).toBeInstanceOf(HTMLElement)
    expect(overflowWidgetsDomNode).toHaveClass('monaco-editor', 'vs-dark')
    expect(overflowWidgetsDomNode).toHaveAttribute(
      'data-code-editor-overflow-widgets'
    )
    expect(overflowWidgetsDomNode.parentElement).toBe(document.body)

    unmount()

    expect(document.body).not.toContainElement(overflowWidgetsDomNode)
  })
})
