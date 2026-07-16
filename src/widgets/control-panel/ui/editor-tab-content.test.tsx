import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { EditorTabContent } from './editor-tab-content'

const baseProps = {
  algorithmExamples: [{ id: 'two-sum', label: 'Two Sum' }],
  selectedExampleId: 'two-sum',
  compilationResult: null,
  onExampleChange: vi.fn(),
  onCompile: vi.fn(),
}

describe('EditorTabContent', () => {
  it('allows compilation with warnings but blocks errors', () => {
    const { rerender } = render(
      <EditorTabContent
        {...baseProps}
        lintErrors={[
          {
            line: 2,
            column: 11,
            message: "Member 'minHeap' implicitly has an 'any' type",
            severity: 'warning',
          },
        ]}
      />
    )

    expect(screen.getByRole('button', { name: 'Compile Code' })).toBeEnabled()

    rerender(
      <EditorTabContent
        {...baseProps}
        lintErrors={[
          {
            line: 10,
            column: 5,
            message: 'This expression is not callable',
            severity: 'error',
          },
        ]}
      />
    )

    expect(screen.getByRole('button', { name: 'Compile Code' })).toBeDisabled()
  })
})
