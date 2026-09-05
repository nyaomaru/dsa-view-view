import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'
import { FUNCTION_ARGUMENTS_LABEL } from '@/entities/execution'
import { DfsComparisonVisualizer } from './dfs-comparison-visualizer'

const grid = [
  ['0', '1'],
  ['0', '0'],
]

const recursive: ExecutionState = {
  currentStep: 1,
  totalSteps: 2,
  isComplete: false,
  steps: [
    {
      stepNumber: 0,
      type: 'function-entry',
      line: 1,
      description: 'Entering function: numIslands',
      variables: { grid, islands: 1 },
      timestamp: 0,
      metadata: {
        callFrame: {
          frameId: 1,
          functionName: 'numIslands',
          phase: 'enter',
          visibleVariableNames: ['grid', 'islands'],
        },
      },
    },
    {
      stepNumber: 1,
      type: 'function-entry',
      line: 4,
      description: 'Entering function: visit',
      variables: {
        grid,
        islands: 1,
        row: 0,
        col: 0,
        [FUNCTION_ARGUMENTS_LABEL]: { row: 0, col: 0 },
      },
      timestamp: 1,
      metadata: {
        callFrame: {
          frameId: 2,
          parentFrameId: 1,
          functionName: 'visit',
          phase: 'enter',
          visibleVariableNames: ['grid', 'islands', 'row', 'col'],
        },
      },
    },
  ],
}

const iterative: ExecutionState = {
  currentStep: 0,
  totalSteps: 1,
  isComplete: false,
  steps: [
    {
      stepNumber: 0,
      type: 'assignment',
      line: 12,
      description: 'stack.push([nextRow, nextCol])',
      variables: {
        grid,
        islands: 1,
        stack: [
          [1, 0],
          [0, 1],
        ],
      },
      timestamp: 0,
    },
  ],
}

describe('DfsComparisonVisualizer', () => {
  it('shows grids and pending work from both DFS implementations', () => {
    render(<DfsComparisonVisualizer comparison={{ recursive, iterative }} />)

    expect(screen.getByText('Recursive DFS')).toBeInTheDocument()
    expect(screen.getByText('Explicit-stack DFS')).toBeInTheDocument()
    expect(
      screen.getByRole('grid', { name: 'Recursive DFS visited grid' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('grid', { name: 'Explicit-stack DFS visited grid' })
    ).toBeInTheDocument()

    const recursiveWork = screen.getByLabelText('Recursive DFS pending work')
    const iterativeWork = screen.getByLabelText(
      'Explicit-stack DFS pending work'
    )

    expect(within(recursiveWork).getByText('visit(0, 0)')).toBeInTheDocument()
    expect(within(recursiveWork).getByText('1 pending')).toBeInTheDocument()
    expect(within(iterativeWork).getByText('[0,1]')).toBeInTheDocument()
    expect(within(iterativeWork).getByText('2 pending')).toBeInTheDocument()
    expect(within(iterativeWork).getByText('Top')).toBeInTheDocument()
  })

  it('confirms matching completed results', () => {
    render(
      <DfsComparisonVisualizer
        comparison={{
          recursive: { ...recursive, isComplete: true, returnValue: 3 },
          iterative: { ...iterative, isComplete: true, returnValue: 3 },
        }}
      />
    )

    expect(screen.getByText('Same result: 3')).toBeInTheDocument()
  })
})
