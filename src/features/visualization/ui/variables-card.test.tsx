import { render, screen } from '@testing-library/react'
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

describe('VariablesCard', () => {
  it('keeps inline visualization icon buttons large enough for the pixel frame', () => {
    render(
      <VariablesCard
        currentStep={step}
        variableEntries={Object.entries(step.variables)}
        expandedVariables={{}}
        hasRecursion={false}
        primaryTreeNodeName="root"
        visualizableTreeNodeNames={['root']}
        onToggleVariable={vi.fn()}
        onOpenStack={vi.fn()}
        onOpenBarChart={vi.fn()}
        onOpenArea={vi.fn()}
        onOpenBinarySearch={vi.fn()}
        onOpenSlidingWindow={vi.fn()}
        onOpenBooleanArray={vi.fn()}
        onOpenGraph={vi.fn()}
        onOpenMatrix={vi.fn()}
        onOpenTreeGraph={vi.fn()}
        onOpenListGraph={vi.fn()}
        onOpenTree={vi.fn()}
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
    const openListGraph = vi.fn()

    render(
      <VariablesCard
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
        onOpenStack={vi.fn()}
        onOpenBarChart={vi.fn()}
        onOpenArea={vi.fn()}
        onOpenBinarySearch={vi.fn()}
        onOpenSlidingWindow={vi.fn()}
        onOpenBooleanArray={vi.fn()}
        onOpenGraph={vi.fn()}
        onOpenMatrix={vi.fn()}
        onOpenTreeGraph={vi.fn()}
        onOpenListGraph={openListGraph}
        onOpenTree={vi.fn()}
      />
    )

    screen.getByTitle('Visualize as list graph').click()

    expect(openListGraph).toHaveBeenCalledWith('fast')
  })
})
