import { render } from '@testing-library/react'
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
  it('keeps body scrolling for non-tree visualizations with call frames', () => {
    const { container } = renderModal('matrix')
    const scrollContainer = container.ownerDocument.querySelector(
      '[data-tree-scroll-container]'
    )

    expect(scrollContainer).toHaveClass('overflow-y-auto')
    expect(scrollContainer).not.toHaveClass('lg:overflow-hidden')
  })

  it('contains overflow inside the call-frame inspector on large screens', () => {
    const { container } = renderModal('tree')
    const scrollContainer = container.ownerDocument.querySelector(
      '[data-tree-scroll-container]'
    )

    expect(scrollContainer).toHaveClass('lg:overflow-hidden')
  })
})
