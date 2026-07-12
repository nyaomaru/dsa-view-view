import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import type { ExecutionState } from '@/entities/execution'

import { ExecutionTimelineCard } from './execution-timeline-card'

const executionState: ExecutionState = {
  currentStep: 1,
  totalSteps: 2,
  steps: [
    {
      stepNumber: 0,
      type: 'assignment',
      line: 8,
      description: 'diameter = Math.max(diameter, left + right)',
      variables: {},
      timestamp: Date.now(),
      callStack: ['root'],
    },
    {
      stepNumber: 1,
      type: 'return',
      line: 10,
      description:
        'return from middleNode line 10: a very long linked-list pointer state description',
      variables: {},
      timestamp: Date.now(),
      callStack: ['root'],
    },
  ],
  isComplete: false,
}

describe('ExecutionTimelineCard', () => {
  it('supports horizontal expansion for long timeline rows', () => {
    const { container } = render(
      <ExecutionTimelineCard
        executionState={executionState}
        isRunning={false}
        timelineRef={createRef()}
        currentStepRef={createRef()}
        onPause={vi.fn()}
        onStart={vi.fn()}
        onReset={vi.fn()}
        onStepForward={vi.fn()}
        onStepBackward={vi.fn()}
        onSkipToEnd={vi.fn()}
      />
    )

    expect(screen.getByText('Execution Timeline')).toBeInTheDocument()
    expect(container.querySelector('.overflow-x-auto')).not.toBeNull()
    expect(container.querySelector('[class*="min-w-[42rem]"]')).not.toBeNull()
    expect(
      screen.getByText(/a very long linked-list pointer state description/)
    ).toHaveClass('whitespace-nowrap')
  })

  it('uses tokenized text color on the current primary row', () => {
    render(
      <ExecutionTimelineCard
        executionState={executionState}
        isRunning={false}
        timelineRef={createRef()}
        currentStepRef={createRef()}
        onPause={vi.fn()}
        onStart={vi.fn()}
        onReset={vi.fn()}
        onStepForward={vi.fn()}
        onStepBackward={vi.fn()}
        onSkipToEnd={vi.fn()}
      />
    )

    expect(
      screen.getByText(/diameter = Math.max/).closest('.rounded-md')
    ).toHaveClass('bg-secondary', 'text-secondary-foreground')
    expect(
      screen.getByText(/return from middleNode/).closest('.rounded-md')
    ).toHaveClass('bg-primary', 'text-timeline-current-foreground')
    expect(screen.getByText('return').closest('.pixel-chip')).toHaveClass(
      'timeline-step-badge--current',
      'text-timeline-current-foreground'
    )
  })
})
