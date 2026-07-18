import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import type { ExecutionStep } from '@/entities/execution'

import { VariablesCard } from './variables-card'

const step: ExecutionStep = {
  stepNumber: 0,
  type: 'function-entry',
  line: 1,
  description: 'Entering function: maxDepth',
  variables: {
    root: {
      val: 1,
      left: null,
      right: null,
    },
  },
  timestamp: Date.now(),
  callStack: ['root', 'maxDepth'],
}

const executionState = {
  currentStep: 0,
  totalSteps: 1,
  steps: [step],
  isComplete: true,
}

describe('VariablesCard', () => {
  it('keeps inline visualization icon buttons large enough for the pixel frame', () => {
    render(
      <VariablesCard
        executionState={executionState}
        currentStep={step}
        variableEntries={Object.entries(step.variables)}
        expandedVariables={{}}
        hasRecursion={false}
        primaryTreeNodeName="root"
        visualizableTreeNodeNames={['root']}
        onToggleVariable={vi.fn()}
        onOpenVisualization={vi.fn()}
        onJumpToStep={vi.fn()}
      />
    )

    const inlineTreeButton = screen.getByTitle('Visualize as tree graph')
    const inlineTreeIcon = inlineTreeButton.querySelector('svg')

    expect(inlineTreeButton).toHaveClass('h-8', 'w-8', 'shrink-0')
    expect(inlineTreeIcon).toHaveClass('h-3.5', 'w-3.5')
    expect(screen.getByText('root').closest('.rounded-md')).toHaveClass(
      'bg-secondary',
      'text-secondary-foreground'
    )
  })

  it('shows a list graph button for nullable pointer variables that were ListNodes before', () => {
    const openVisualization = vi.fn()

    render(
      <VariablesCard
        executionState={{
          ...executionState,
          steps: [
            {
              ...step,
              variables: {
                fast: null,
              },
            },
          ],
        }}
        currentStep={{
          ...step,
          variables: {
            fast: null,
          },
        }}
        variableEntries={[['fast', null]]}
        expandedVariables={{}}
        hasRecursion={false}
        visualizableListNodeNames={['fast']}
        onToggleVariable={vi.fn()}
        onOpenVisualization={openVisualization}
        onJumpToStep={vi.fn()}
      />
    )

    screen.getByTitle('Visualize as list graph').click()

    expect(openVisualization).toHaveBeenCalledWith('list-graph', 'fast')
  })

  it('jumps to the previous pointer change and compares adjacent values', () => {
    const pointerSteps: ExecutionStep[] = [0, 0, 1, 1, 2, 2].map(
      (left, stepNumber) => ({
        stepNumber,
        type: 'assignment',
        line: stepNumber + 1,
        description: `left = ${left}`,
        variables: { left },
        timestamp: stepNumber,
      })
    )
    const pointerState = {
      currentStep: 5,
      totalSteps: pointerSteps.length,
      steps: pointerSteps,
      isComplete: true,
    }
    const jumpToStep = vi.fn()
    const { rerender } = render(
      <VariablesCard
        executionState={pointerState}
        currentStep={pointerSteps[5]}
        variableEntries={Object.entries(pointerSteps[5].variables)}
        expandedVariables={{}}
        hasRecursion={false}
        onToggleVariable={vi.fn()}
        onOpenVisualization={vi.fn()}
        onJumpToStep={jumpToStep}
      />
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'Variable to track' }))
    fireEvent.click(screen.getByRole('option', { name: 'left' }))

    const selectedRow = screen
      .getAllByText('left')
      .find((element) => element.tagName === 'CODE')
      ?.closest('.rounded-md')
    expect(selectedRow).toHaveClass('ring-2', 'ring-primary')

    fireEvent.click(screen.getByRole('button', { name: 'Previous change' }))
    expect(jumpToStep).toHaveBeenCalledWith(4)

    rerender(
      <VariablesCard
        executionState={{ ...pointerState, currentStep: 4, isComplete: false }}
        currentStep={pointerSteps[4]}
        variableEntries={Object.entries(pointerSteps[4].variables)}
        expandedVariables={{}}
        hasRecursion={false}
        onToggleVariable={vi.fn()}
        onOpenVisualization={vi.fn()}
        onJumpToStep={jumpToStep}
      />
    )

    const comparison = screen.getByLabelText('left value change')
    expect(within(comparison).getByText('1')).toBeInTheDocument()
    expect(within(comparison).getByText('2')).toBeInTheDocument()
  })

  it('disables previous change when the selected variable has no earlier transition', () => {
    render(
      <VariablesCard
        executionState={executionState}
        currentStep={step}
        variableEntries={Object.entries(step.variables)}
        expandedVariables={{}}
        hasRecursion={false}
        onToggleVariable={vi.fn()}
        onOpenVisualization={vi.fn()}
        onJumpToStep={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'Variable to track' }))
    fireEvent.click(screen.getByRole('option', { name: 'root' }))

    expect(
      screen.getByRole('button', { name: 'Previous change' })
    ).toBeDisabled()
  })
})
