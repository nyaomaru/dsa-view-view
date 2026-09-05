import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import type { ExecutionState } from '@/entities/execution'

import type { VisualizationType } from '../model/types'
import { VisualizationModal } from './visualization-modal'

const executionState: ExecutionState = {
  currentStep: 0,
  totalSteps: 1,
  isComplete: false,
  steps: [
    {
      stepNumber: 0,
      type: 'function-entry',
      line: 1,
      description: 'Entering function: solve',
      variables: { matrix: [[1]] },
      timestamp: 0,
      metadata: {
        callFrame: {
          frameId: 1,
          functionName: 'solve',
          phase: 'enter',
          visibleVariableNames: ['matrix'],
        },
      },
    },
  ],
}

function renderModal(type: VisualizationType) {
  return render(
    <VisualizationModal
      isOpen
      onClose={vi.fn()}
      type={type}
      targetVariable="matrix"
      executionState={executionState}
      isRunning={false}
      onPause={vi.fn()}
      onRunAll={vi.fn()}
      onReset={vi.fn()}
      onStepForward={vi.fn()}
      onStepBackward={vi.fn()}
      onSkipToEnd={vi.fn()}
    />
  )
}

describe('VisualizationModal', () => {
  it('uses the near-full mobile viewport and restores the desktop dialog layout', () => {
    renderModal('matrix')

    const dialog = screen.getByRole('dialog')

    expect(dialog).toHaveClass(
      'left-1',
      'top-2',
      'h-[calc(100dvh-1rem)]',
      'w-[calc(100vw-0.5rem)]',
      'max-w-none',
      'p-1',
      'sm:left-[50%]',
      'sm:top-[50%]',
      'sm:max-w-3xl'
    )
    const playbackControls = screen.getByRole('group', {
      name: 'Visualization playback controls',
    })

    expect(playbackControls).toBeInTheDocument()
    expect(playbackControls).not.toHaveClass('border-t', 'bg-background')
  })

  it('keeps body scrolling for non-tree visualizations with call frames', () => {
    const { container } = renderModal('matrix')
    const scrollContainer = container.ownerDocument.querySelector(
      '[data-tree-scroll-container]'
    )

    expect(scrollContainer).toHaveClass('min-h-0', 'min-w-0', 'overflow-auto')
    expect(scrollContainer).not.toHaveClass('lg:overflow-hidden')
  })

  it('contains overflow inside the call-frame inspector on large screens', () => {
    const { container } = renderModal('tree')
    const scrollContainer = container.ownerDocument.querySelector(
      '[data-tree-scroll-container]'
    )

    expect(scrollContainer).toHaveClass('lg:overflow-hidden')
  })

  it('keeps the DFS comparison body scrollable on large screens', () => {
    const { container } = renderModal('dfs-comparison')
    const scrollContainer = container.ownerDocument.querySelector(
      '[data-tree-scroll-container]'
    )

    expect(scrollContainer).toHaveClass('overflow-auto')
    expect(scrollContainer).not.toHaveClass('lg:overflow-hidden')
  })
})
