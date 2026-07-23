import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import {
  FUNCTION_ARGUMENTS_LABEL,
  RETURN_VALUE_LABEL,
  type CallFramePhase,
  type ExecutionState,
  type ExecutionStep,
} from '@/entities/execution'
import { CallFrameInspector } from './call-frame-inspector'

function createStep({
  frameId,
  parentFrameId,
  phase,
  variables,
  visibleVariableNames = Object.keys(variables),
}: {
  frameId: number
  parentFrameId?: number
  phase: CallFramePhase
  variables: Record<string, unknown>
  visibleVariableNames?: string[]
}): ExecutionStep {
  return {
    stepNumber: 1,
    type:
      phase === 'enter'
        ? 'function-entry'
        : phase === 'return'
          ? 'return'
          : 'assignment',
    line: 1,
    description: `dfs ${phase}`,
    variables,
    timestamp: 0,
    metadata: {
      callFrame: {
        frameId,
        parentFrameId,
        functionName: 'dfs',
        phase,
        visibleVariableNames,
      },
    },
  }
}

const steps: ExecutionState['steps'] = [
  createStep({
    frameId: 1,
    phase: 'enter',
    variables: {
      [FUNCTION_ARGUMENTS_LABEL]: { node: 'root', depth: 0 },
      node: 'root',
      depth: 0,
    },
  }),
  createStep({
    frameId: 1,
    phase: 'update',
    variables: { node: 'root', depth: 0, total: 0 },
  }),
  createStep({
    frameId: 2,
    parentFrameId: 1,
    phase: 'enter',
    variables: {
      [FUNCTION_ARGUMENTS_LABEL]: { node: 'left', depth: 1 },
      node: 'left',
      depth: 1,
      total: 0,
    },
    visibleVariableNames: [FUNCTION_ARGUMENTS_LABEL, 'node', 'depth'],
  }),
  createStep({
    frameId: 2,
    parentFrameId: 1,
    phase: 'update',
    variables: {
      node: 'left',
      depth: 1,
      total: 0,
      childOnly: 'left frame',
    },
    visibleVariableNames: ['node', 'depth', 'childOnly'],
  }),
  createStep({
    frameId: 2,
    parentFrameId: 1,
    phase: 'return',
    variables: {
      node: 'left',
      depth: 1,
      total: 0,
      childOnly: 'left frame',
      [RETURN_VALUE_LABEL]: 1,
    },
    visibleVariableNames: ['node', 'depth', 'childOnly', RETURN_VALUE_LABEL],
  }),
  createStep({
    frameId: 1,
    phase: 'return',
    variables: {
      node: 'root',
      depth: 0,
      total: 1,
      [RETURN_VALUE_LABEL]: 1,
    },
    visibleVariableNames: ['node', 'depth', 'total', RETURN_VALUE_LABEL],
  }),
  {
    stepNumber: 6,
    type: 'return',
    line: 0,
    description: 'Returned: 1',
    variables: { result: 1 },
    timestamp: 0,
  },
]

function createState(currentStep: number): ExecutionState {
  return {
    currentStep,
    totalSteps: steps.length,
    steps,
    isComplete: false,
  }
}

describe('CallFrameInspector', () => {
  it('selects a suspended caller without mixing its locals with the child', () => {
    render(<CallFrameInspector executionState={createState(3)} />)

    const childButton = screen.getByRole('button', { name: /dfs #2/i })
    const parentButton = screen.getByRole('button', { name: /dfs #1/i })

    expect(childButton).toHaveAttribute('aria-current', 'true')
    expect(childButton).toHaveAttribute('aria-pressed', 'true')
    expect(parentButton).toHaveTextContent('Suspended')

    fireEvent.click(parentButton)

    const parentDetails = screen.getByRole('region', {
      name: 'dfs #1 frame details',
    })
    expect(parentDetails).toHaveTextContent('root')
    expect(parentDetails).toHaveTextContent('total')
    expect(parentDetails).not.toHaveTextContent('childOnly')
    expect(parentDetails).toHaveTextContent(
      'Showing the last state observed before this frame was suspended.'
    )

    fireEvent.click(childButton)

    const callerContext = screen.getByRole('region', {
      name: 'Caller context',
    })
    expect(callerContext).toHaveTextContent(
      'State from dfs #1 immediately before this call.'
    )
    expect(callerContext).toHaveTextContent('total')
    expect(callerContext).toHaveTextContent('0')
  })

  it('synchronizes selection when moving before a selected frame existed', () => {
    const { rerender } = render(
      <CallFrameInspector executionState={createState(3)} />
    )

    fireEvent.click(screen.getByRole('button', { name: /dfs #2/i }))
    rerender(<CallFrameInspector executionState={createState(1)} />)

    expect(
      screen.queryByRole('button', { name: /dfs #2/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'dfs #1 frame details' })
    ).toBeInTheDocument()
  })

  it('follows the current invocation until a frame is selected explicitly', () => {
    const { rerender } = render(
      <CallFrameInspector executionState={createState(1)} />
    )

    expect(
      screen.getByRole('region', { name: 'dfs #1 frame details' })
    ).toBeInTheDocument()

    rerender(<CallFrameInspector executionState={createState(3)} />)

    expect(
      screen.getByRole('region', { name: 'dfs #2 frame details' })
    ).toBeInTheDocument()
  })

  it('shows the returning frame and its return value', () => {
    render(<CallFrameInspector executionState={createState(4)} />)

    const returningButton = screen.getByRole('button', { name: /dfs #2/i })
    const details = screen.getByRole('region', {
      name: 'dfs #2 frame details',
    })

    expect(returningButton).toHaveAttribute('aria-current', 'true')
    expect(returningButton).toHaveTextContent('Returning')
    const returnSection = within(details)
      .getByText('Return value')
      .closest('section')
    expect(returnSection).not.toBeNull()
    expect(within(returnSection!).getByText('1')).toBeInTheDocument()
  })

  it('keeps completed calls without repeating the Completed label', () => {
    render(<CallFrameInspector executionState={createState(6)} />)

    const guidance = screen.getByLabelText('No active calls')

    expect(guidance).toHaveClass('border-primary/25', 'bg-primary/5')
    expect(guidance).toHaveTextContent(
      'Step backward to inspect an earlier call frame.'
    )
    expect(screen.getByText('Completed calls')).toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dfs #1/i })).toHaveClass(
      'cursor-pointer'
    )

    const completedSection = screen
      .getByText('Completed calls')
      .closest('section')
    const completedList = completedSection?.querySelector('.overflow-y-auto')

    expect(completedSection).toHaveClass('lg:min-h-0', 'lg:flex-1')
    expect(completedList).toHaveClass('lg:min-h-0', 'lg:flex-1')
  })
})
