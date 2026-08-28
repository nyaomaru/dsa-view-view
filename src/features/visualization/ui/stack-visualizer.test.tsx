import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'

import { VisualizationModalContent } from './visualization-modal-content'

describe('StackVisualizer', () => {
  it('shows the active runtime comparison alongside an empty stack', () => {
    const comparison = {
      left: { expression: 'stack.pop()', value: undefined },
      operator: '!==',
      right: { expression: 'pairs.get(char)', value: '(' },
      result: true,
    } as const
    const currentStep: ExecutionState['steps'][number] = {
      stepNumber: 0,
      type: 'condition',
      line: 1,
      description: 'Compare stack.pop() !== pairs.get(char) -> true',
      variables: { stack: [] },
      timestamp: 0,
      metadata: { comparison },
    }
    const executionState: ExecutionState = {
      currentStep: 0,
      totalSteps: 1,
      steps: [currentStep],
      isComplete: false,
    }

    render(
      <VisualizationModalContent
        type="stack"
        targetVariable="stack"
        executionState={executionState}
        currentStep={currentStep}
      />
    )

    expect(screen.getByText('Empty Stack')).toBeInTheDocument()
    expect(screen.getByLabelText('Runtime comparison')).toBeInTheDocument()
    expect(screen.getByText('undefined')).toBeInTheDocument()
  })
})
