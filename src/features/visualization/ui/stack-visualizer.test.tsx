import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'

import { VisualizationModalContent } from './visualization-modal-content'

describe('StackVisualizer', () => {
  it('keeps the latest runtime comparison visible on following steps', () => {
    const comparison = {
      left: { expression: 'stack.pop()', value: undefined },
      operator: '!==',
      right: { expression: 'pairs.get(char)', value: '(' },
      result: true,
    } as const
    const comparisonStep: ExecutionState['steps'][number] = {
      stepNumber: 0,
      type: 'condition',
      line: 1,
      description: 'Compare stack.pop() !== pairs.get(char) -> true',
      variables: { stack: [] },
      timestamp: 0,
      metadata: { comparison },
    }
    const currentStep: ExecutionState['steps'][number] = {
      stepNumber: 1,
      type: 'array-mutation',
      line: 2,
      description: 'stack.pop()',
      variables: { stack: [] },
      timestamp: 1,
    }
    const executionState: ExecutionState = {
      currentStep: 1,
      totalSteps: 2,
      steps: [comparisonStep, currentStep],
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
