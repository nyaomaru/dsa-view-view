import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import type { ExecutionState } from '@/entities/execution'

import { Visualizer } from './visualizer'

const createExecutionState = (returnValue: unknown): ExecutionState => ({
  currentStep: 0,
  totalSteps: 1,
  steps: [
    {
      stepNumber: 0,
      type: 'return',
      line: 1,
      description: 'Returned',
      variables: {},
      timestamp: Date.now(),
      callStack: ['root'],
    },
  ],
  isComplete: true,
  returnValue,
})

const createExecutionStateWithSteps = (
  steps: ExecutionState['steps']
): ExecutionState => ({
  currentStep: steps.length - 1,
  totalSteps: steps.length,
  steps,
  isComplete: true,
})

const noop = () => {}
const scrollIntoViewMock = vi.fn()

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: scrollIntoViewMock,
  writable: true,
})

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  value: () => {},
  writable: true,
})

describe('Visualizer return value display', () => {
  it('keeps the viewport and focus in place when jumping to a previous variable change', () => {
    const steps: ExecutionState['steps'] = [0, 0, 1, 1, 2, 2].map(
      (left, stepNumber) => ({
        stepNumber,
        type: 'assignment',
        line: stepNumber + 1,
        description: `left = ${left}`,
        variables: { left },
        timestamp: stepNumber,
      })
    )
    const jumpToStep = vi.fn()
    const renderAtStep = (currentStep: number) => (
      <Visualizer
        executionState={{
          currentStep,
          totalSteps: steps.length,
          steps,
          isComplete: false,
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={jumpToStep}
      />
    )
    const { rerender } = render(renderAtStep(5))
    scrollIntoViewMock.mockClear()

    fireEvent.click(screen.getByRole('combobox', { name: 'Variable to track' }))
    fireEvent.click(screen.getByRole('option', { name: 'left' }))
    const previousChangeButton = screen.getByRole('button', {
      name: 'Previous change',
    })
    previousChangeButton.focus()
    fireEvent.click(previousChangeButton)

    expect(jumpToStep).toHaveBeenCalledWith(4)
    scrollIntoViewMock.mockClear()

    rerender(renderAtStep(4))

    expect(scrollIntoViewMock).not.toHaveBeenCalled()
    expect(previousChangeButton).toHaveFocus()

    rerender(renderAtStep(3))

    expect(scrollIntoViewMock).toHaveBeenCalledOnce()
  })

  it('surfaces runtime errors near the top of the runtime view', () => {
    render(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps([
            {
              stepNumber: 0,
              type: 'return',
              line: 0,
              description: 'Error: boom',
              variables: {},
              timestamp: Date.now(),
              callStack: ['root'],
            },
          ]),
          error: 'boom',
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const currentStepTitle = screen.getByText('Current Step')
    const errorTitle = screen.getByText('Execution Error')
    const variablesTitle = screen.getByText('Variables')

    expect(errorTitle.compareDocumentPosition(currentStepTitle)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING
    )
    expect(errorTitle.compareDocumentPosition(variablesTitle)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('labels truncated executions as warnings', () => {
    render(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps([
            {
              stepNumber: 0,
              type: 'return',
              line: 0,
              description: 'Warning: Execution truncated at 10,000 steps.',
              variables: {},
              timestamp: Date.now(),
              callStack: ['root'],
            },
          ]),
          error:
            'Execution truncated at 10,000 steps. The algorithm may have too many steps to visualize.',
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('Execution Warning')).toBeInTheDocument()
    expect(screen.queryByText('Execution Error')).not.toBeInTheDocument()
  })

  it('shows primitive return values without requiring expansion', () => {
    render(
      <Visualizer
        executionState={createExecutionState(13)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const returnCard = screen
      .getByText('Return Value')
      .closest('.border-primary')

    expect(returnCard).not.toBeNull()
    expect(
      within(returnCard as HTMLElement).getByText('13')
    ).toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).queryByText('Show details')
    ).not.toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).queryByText(
        'Return value hidden. Open details to inspect it.'
      )
    ).not.toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).queryByText(
        'Want to see how this result was reached?'
      )
    ).not.toBeInTheDocument()
  })

  it('offers step-by-step review after a multi-step execution completes', () => {
    const onStepBackward = vi.fn()
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Entering function: add',
        variables: { total: 0 },
        timestamp: Date.now(),
        callStack: ['root', 'add'],
      },
      {
        stepNumber: 1,
        type: 'return',
        line: 2,
        description: 'Returned',
        variables: { total: 3 },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]

    render(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps(steps),
          returnValue: 3,
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={onStepBackward}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const returnCard = screen
      .getByText('Return Value')
      .closest('.border-primary')

    expect(
      within(returnCard as HTMLElement).getByText(
        'Want to see how this result was reached?'
      )
    ).toBeInTheDocument()

    fireEvent.click(
      within(returnCard as HTMLElement).getByRole('button', {
        name: 'Step Backward',
      })
    )

    expect(onStepBackward).toHaveBeenCalledOnce()
  })

  it('shows the final return value inside an open visualization modal', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Entering function: selectionSort',
        variables: { nums: [3, 1, 2] },
        timestamp: Date.now(),
        callStack: ['root', 'selectionSort'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 4,
        description: 'swap nums[0] and nums[1]',
        variables: { nums: [1, 3, 2] },
        timestamp: Date.now(),
        callStack: ['root', 'selectionSort'],
      },
    ]

    render(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps(steps),
          returnValue: 42,
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Sort Graph'))

    const dialog = screen.getByRole('dialog')
    const returnCard = within(dialog)
      .getByText('Return Value')
      .closest('.border-primary')

    expect(returnCard).not.toBeNull()
    expect(
      within(returnCard as HTMLElement).getByText('42')
    ).toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).getByText(
        'Want to see how this result was reached?'
      )
    ).toBeInTheDocument()
  })

  it('shows compact graph-node return values without requiring expansion', () => {
    const one = { val: 1, neighbors: [] as unknown[] }
    const two = { val: 2, neighbors: [] as unknown[] }
    const three = { val: 3, neighbors: [] as unknown[] }
    const four = { val: 4, neighbors: [] as unknown[] }

    one.neighbors = [two, four]
    two.neighbors = [one, three]
    three.neighbors = [two, four]
    four.neighbors = [one, three]

    render(
      <Visualizer
        executionState={createExecutionState(one)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const returnCard = screen
      .getByText('Return Value')
      .closest('.border-primary')

    expect(returnCard).not.toBeNull()
    expect(
      within(returnCard as HTMLElement).getByText('[[2,4],[1,3],[2,4],[1,3]]')
    ).toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).queryByText('Show details')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Graph View'))

    expect(screen.getByText('Graph: return value')).toBeInTheDocument()
    expect(screen.getByText('return value (Graph)')).toBeInTheDocument()
  })

  it('shows compact array return values without requiring expansion', () => {
    render(
      <Visualizer
        executionState={createExecutionState([
          [-1, -1, 2],
          [-1, 0, 1],
        ])}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const returnCard = screen
      .getByText('Return Value')
      .closest('.border-primary')

    expect(returnCard).not.toBeNull()
    expect(
      within(returnCard as HTMLElement).getByText('[[-1,-1,2],[-1,0,1]]')
    ).toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).queryByText('Show details')
    ).not.toBeInTheDocument()
  })

  it('keeps returned arrays out of variable visualizations', () => {
    render(
      <Visualizer
        executionState={{
          ...createExecutionState([
            [2, 2, 2, 2],
            [2, 3, 3],
            [3, 5],
          ]),
          steps: [
            {
              stepNumber: 0,
              type: 'return',
              line: 21,
              description: 'return from combinationSum line 21: result',
              variables: {
                'return value': [
                  [2, 2, 2, 2],
                  [2, 3, 3],
                  [3, 5],
                ],
              },
              timestamp: Date.now(),
              callStack: ['root', 'combinationSum'],
            },
          ],
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const variablesCard = screen.getByText('Variables').closest('.pixel-panel')
    const returnCard = screen
      .getByText('Return Value')
      .closest('.border-primary')

    expect(variablesCard).not.toBeNull()
    expect(returnCard).not.toBeNull()
    expect(
      within(variablesCard as HTMLElement).queryByText('return value')
    ).not.toBeInTheDocument()
    expect(
      within(variablesCard as HTMLElement).queryByTitle('Visualize as stack')
    ).not.toBeInTheDocument()
    expect(
      within(variablesCard as HTMLElement).queryByTitle('Visualize as graph')
    ).not.toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).getByText('[[2,2,2,2],[2,3,3],[3,5]]')
    ).toBeInTheDocument()
  })

  it('shows a tree graph control for TreeNode return values', () => {
    const returnTree = {
      val: 3,
      left: { val: 9, left: null, right: null },
      right: {
        val: 20,
        left: { val: 15, left: null, right: null },
        right: { val: 7, left: null, right: null },
      },
    }

    render(
      <Visualizer
        executionState={createExecutionState(returnTree)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const variablesCard = screen.getByText('Variables').closest('.pixel-panel')

    expect(screen.getByText('Tree Graph')).toBeInTheDocument()
    expect(variablesCard).not.toBeNull()
    expect(
      within(variablesCard as HTMLElement).queryByText('return value')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Tree Graph'))

    expect(screen.getByText('Tree Graph: return value')).toBeInTheDocument()
    expect(screen.getByText('return value Tree Graph')).toBeInTheDocument()
  })

  it('auto-opens TreeNode return values when runtime starts', async () => {
    const returnTree = {
      val: 3,
      left: { val: 9, left: null, right: null },
      right: {
        val: 20,
        left: { val: 15, left: null, right: null },
        right: { val: 7, left: null, right: null },
      },
    }

    render(
      <Visualizer
        executionState={{
          ...createExecutionState(returnTree),
          isComplete: false,
        }}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Tree Graph: return value')).toBeInTheDocument()
    })
    expect(screen.getByText('return value Tree Graph')).toBeInTheDocument()
  })

  it('auto-opens Heap View from the first detected heap snapshot', async () => {
    const executionState = createExecutionStateWithSteps([
      {
        stepNumber: 0,
        type: 'function-call',
        line: 0,
        description: 'Function called',
        variables: {},
        timestamp: 0,
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 7,
        description: 'this.maxHeap = new MaxHeap()',
        variables: {},
        timestamp: 1,
        metadata: {
          heapTrace: {
            heaps: [
              { name: 'minHeap', kind: 'min', values: [] },
              { name: 'maxHeap', kind: 'max', values: [] },
            ],
          },
        },
      },
    ])

    render(
      <Visualizer
        executionState={{
          ...executionState,
          currentStep: 0,
          isComplete: false,
        }}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Heap View' })
      ).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Max Heap maxHeap')).toBeInTheDocument()
    expect(screen.getByLabelText('Min Heap minHeap')).toBeInTheDocument()
    expect(
      screen.queryByText('Prepared heap state is not available at this step.')
    ).not.toBeInTheDocument()
  })

  it('auto-opens Word Ladder View for matching BFS inputs', async () => {
    const executionState = createExecutionStateWithSteps([
      {
        stepNumber: 0,
        type: 'function-call',
        line: 0,
        description: 'Function called',
        variables: {
          beginWord: 'hit',
          endWord: 'cog',
          wordList: ['hot', 'dot', 'dog', 'lot', 'log', 'cog'],
        },
        timestamp: 0,
      },
    ])

    render(
      <Visualizer
        executionState={{ ...executionState, isComplete: false }}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Word Ladder View' })
      ).toBeInTheDocument()
    })
    expect(screen.getByLabelText('hit: unvisited')).toBeInTheDocument()
    expect(screen.getByLabelText('cog: unvisited, target')).toBeInTheDocument()
  })

  it('auto-opens Expression View and follows calculator playback', async () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { s: '1+2' },
        timestamp: 0,
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 9,
        description: 'Read digit',
        variables: {
          s: '1+2',
          res: 0,
          num: 1,
          sign: 1,
          stack: [1],
          i: 0,
          char: '1',
        },
        timestamp: 1,
      },
      {
        stepNumber: 2,
        type: 'assignment',
        line: 14,
        description: 'Apply operator',
        variables: {
          s: '1+2',
          res: 1,
          num: 0,
          sign: 1,
          stack: [1],
          i: 1,
          char: '+',
        },
        timestamp: 2,
      },
    ]
    const renderAtStep = (currentStep: number) => (
      <Visualizer
        executionState={{
          currentStep,
          totalSteps: steps.length,
          steps,
          isComplete: false,
        }}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )
    const { rerender } = render(renderAtStep(0))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Expression View' })
      ).toBeInTheDocument()
    })
    expect(
      screen.getByLabelText('Current character 1 at index 0')
    ).toBeInTheDocument()

    rerender(renderAtStep(2))

    expect(
      screen.getByLabelText('Current character + at index 1')
    ).toBeInTheDocument()
    expect(screen.getByText('Applying operator')).toBeInTheDocument()
  })

  it('auto-opens constructed local roots before falling back to TreeNode return values', async () => {
    const partialRoot = {
      val: 3,
      left: { val: 9, left: null, right: null },
      right: null,
    }
    const returnTree = {
      val: 3,
      left: { val: 9, left: null, right: null },
      right: {
        val: 20,
        left: { val: 15, left: null, right: null },
        right: { val: 7, left: null, right: null },
      },
    }

    render(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps([
            {
              stepNumber: 0,
              type: 'function-call',
              line: 0,
              description: 'Function called with: {}',
              variables: {
                preorder: [3, 9, 20, 15, 7],
                inorder: [9, 3, 15, 20, 7],
              },
              timestamp: Date.now(),
              callStack: ['root'],
            },
            {
              stepNumber: 1,
              type: 'assignment',
              line: 18,
              description: 'const root = new TreeNode(rootVal)',
              variables: {
                root: { val: 3, left: null, right: null },
              },
              timestamp: Date.now(),
              callStack: ['root', 'buildTree', 'build'],
            },
            {
              stepNumber: 2,
              type: 'assignment',
              line: 24,
              description: 'root.left = build(...)',
              variables: { root: partialRoot },
              timestamp: Date.now(),
              callStack: ['root', 'buildTree', 'build'],
            },
          ]),
          currentStep: 0,
          isComplete: false,
          returnValue: returnTree,
        }}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Tree Graph: root')).toBeInTheDocument()
    })
    expect(screen.getByText('root Tree Graph')).toBeInTheDocument()
  })

  it('keeps complex return values collapsed by default', () => {
    render(
      <Visualizer
        executionState={createExecutionState({ value: 13 })}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const returnCard = screen
      .getByText('Return Value')
      .closest('.border-primary')

    expect(returnCard).not.toBeNull()
    expect(
      within(returnCard as HTMLElement).getByText('Show details')
    ).toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).getByText(
        'Return value hidden. Open details to inspect it.'
      )
    ).toBeInTheDocument()
  })

  it('keeps large array return values collapsed by default', () => {
    render(
      <Visualizer
        executionState={createExecutionState(
          Array.from({ length: 100 }, (_, index) => index)
        )}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const returnCard = screen
      .getByText('Return Value')
      .closest('.border-primary')

    expect(returnCard).not.toBeNull()
    expect(
      within(returnCard as HTMLElement).getByText('Show details')
    ).toBeInTheDocument()
    expect(
      within(returnCard as HTMLElement).getByText(
        'Return value hidden. Open details to inspect it.'
      )
    ).toBeInTheDocument()
  })

  it('hides Sort Graph when a numeric array is only read', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { nums: [5, 4, 3], result: 0 },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 1,
        type: 'loop-iteration',
        line: 2,
        description: 'for loop',
        variables: { nums: [5, 4, 3], result: 5 },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()
  })

  it('shows an index view for binary search ranges', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { nums: [1, 3, 5, 7, 9, 11], target: 7 },
        timestamp: Date.now(),
        callStack: ['root', 'binarySearch'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 6,
        description: 'const mid = Math.floor((left + right) / 2)',
        variables: {
          nums: [1, 3, 5, 7, 9, 11],
          target: 7,
          left: 0,
          right: 5,
          mid: 2,
        },
        timestamp: Date.now(),
        callStack: ['root', 'binarySearch'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Index View'))

    expect(
      screen.getByRole('heading', { name: 'Index View: nums' })
    ).toBeInTheDocument()
    expect(screen.getByText('left: 0')).toBeInTheDocument()
    expect(screen.getByText('right: 5')).toBeInTheDocument()
    expect(screen.getByText('mid: 2')).toBeInTheDocument()
  })

  it('keeps binary search index view synced with the current step', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 6,
        description: 'const mid = Math.floor((left + right) / 2)',
        variables: {
          nums: [1, 3, 5, 7, 9, 11],
          target: 9,
          left: 0,
          right: 5,
          mid: 2,
        },
        timestamp: Date.now(),
        callStack: ['root', 'binarySearch'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 6,
        description: 'const mid = Math.floor((left + right) / 2)',
        variables: {
          nums: [1, 3, 5, 7, 9, 11],
          target: 9,
          left: 3,
          right: 5,
          mid: 4,
        },
        timestamp: Date.now(),
        callStack: ['root', 'binarySearch'],
      },
    ]
    const { rerender } = render(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps(steps),
          currentStep: 0,
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Index View'))
    expect(screen.getByText('left: 0')).toBeInTheDocument()
    expect(screen.getByText('right: 5')).toBeInTheDocument()
    expect(screen.getByText('mid: 2')).toBeInTheDocument()

    rerender(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps(steps),
          currentStep: 1,
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('left: 3')).toBeInTheDocument()
    expect(screen.getByText('right: 5')).toBeInTheDocument()
    expect(screen.getByText('mid: 4')).toBeInTheDocument()
    expect(screen.queryByText('left: 0')).not.toBeInTheDocument()
    expect(screen.queryByText('mid: 2')).not.toBeInTheDocument()
  })

  it('auto-opens sliding-window strings instead of stack visualization', async () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: findAnagrams',
        variables: { s: 'cbaebabacd', p: 'abc' },
        timestamp: Date.now(),
        callStack: ['root', 'findAnagrams'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 23,
        description: 'result.push(left)',
        variables: {
          s: 'cbaebabacd',
          p: 'abc',
          result: [0],
          m: 3,
          left: 0,
          right: 2,
        },
        timestamp: Date.now(),
        callStack: ['root', 'findAnagrams'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(
      await screen.findAllByRole('heading', { name: 'Sliding Window View: s' })
    ).toHaveLength(1)
    expect(screen.getByText('left: 0')).toBeInTheDocument()
    expect(screen.getByText('right: 2')).toBeInTheDocument()
    expect(screen.queryByText('Stack Visualization: s')).not.toBeInTheDocument()
  })

  it('auto-opens a rain-water area view with resolved water', async () => {
    const height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { height },
        timestamp: Date.now(),
        callStack: ['root', 'trap'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 12,
        description: 'water += leftMax - height[left]',
        variables: {
          height,
          left: 3,
          right: 10,
          leftMax: 1,
          rightMax: 1,
          water: 1,
        },
        timestamp: Date.now(),
        callStack: ['root', 'trap'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(
      await screen.findByRole('heading', { name: 'Area View: height' })
    ).toBeInTheDocument()
    expect(screen.getByText('Rain Water View: height')).toBeInTheDocument()
    expect(screen.getByText('water=1')).toBeInTheDocument()
    expect(screen.getByLabelText('Water at index 2: 1')).toBeInTheDocument()
  })

  it('shows Sort Graph when a numeric array changes in a sort trace', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Entering function: selectionSort',
        variables: { nums: [5, 3, 1] },
        timestamp: Date.now(),
        callStack: ['root', 'selectionSort'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 4,
        description: 'swap nums[0] and nums[2]',
        variables: { nums: [1, 3, 5] },
        timestamp: Date.now(),
        callStack: ['root', 'selectionSort'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('Sort Graph')).toBeInTheDocument()
  })

  it('hides Sort Graph for numeric counting arrays outside sort traces', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Entering function: leastInterval',
        variables: { tasks: ['A', 'A', 'B'], n: 2 },
        timestamp: Date.now(),
        callStack: ['root', 'leastInterval'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 2,
        description: 'const freq = new Array(26).fill(0)',
        variables: { freq: [0, 0, 0], tasks: ['A', 'A', 'B'], n: 2 },
        timestamp: Date.now(),
        callStack: ['root', 'leastInterval'],
      },
      {
        stepNumber: 2,
        type: 'assignment',
        line: 6,
        description: 'freq[task.charCodeAt(0) - A]++',
        variables: { freq: [2, 1, 0], tasks: ['A', 'A', 'B'], n: 2 },
        timestamp: Date.now(),
        callStack: ['root', 'leastInterval'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()
  })

  it('prefers a mutated result array over a read-only matrix input', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: {
          matrix,
        },
        timestamp: Date.now(),
        callStack: ['root', 'spiralOrder'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 9,
        description: 'const res = []',
        variables: {
          matrix,
          top: 0,
          bottom: 2,
          left: 0,
          right: 2,
          res: [],
        },
        timestamp: Date.now(),
        callStack: ['root', 'spiralOrder'],
      },
      {
        stepNumber: 2,
        type: 'array-mutation',
        line: 13,
        description: 'res.push(matrix[top][col])',
        variables: {
          matrix,
          top: 0,
          bottom: 2,
          left: 0,
          right: 2,
          col: 0,
          res: [1],
        },
        timestamp: Date.now(),
        callStack: ['root', 'spiralOrder'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Matrix View')).not.toBeInTheDocument()
    expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()

    const resRow = screen.getByText('res').closest('.rounded-md')
    expect(resRow).not.toBeNull()

    fireEvent.click(
      within(resRow as HTMLElement).getByTitle('Visualize as stack')
    )

    expect(screen.getByText('Stack Visualization: res')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('keeps a result array chart visible when rerun resets before the result exists', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Entering function: sortRows',
        variables: {
          matrix,
        },
        timestamp: Date.now(),
        callStack: ['root', 'sortRows'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 9,
        description: 'const res = []',
        variables: {
          matrix,
          res: [],
        },
        timestamp: Date.now(),
        callStack: ['root', 'sortRows'],
      },
      {
        stepNumber: 2,
        type: 'array-mutation',
        line: 13,
        description: 'sort result push',
        variables: {
          matrix,
          res: [1],
        },
        timestamp: Date.now(),
        callStack: ['root', 'sortRows'],
      },
    ]
    const { rerender } = render(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps(steps),
          currentStep: 2,
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Sort Graph'))
    expect(
      screen.getByRole('heading', { name: 'Bar Chart: res' })
    ).toBeInTheDocument()
    expect(screen.getByText('res: [1]')).toBeInTheDocument()

    rerender(
      <Visualizer
        executionState={{
          ...createExecutionStateWithSteps(steps),
          currentStep: 0,
        }}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Bar Chart: res' })
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Unable to visualize "res"')
    ).not.toBeInTheDocument()
  })

  it('shows a vertical DP View for mutated boolean arrays', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { nums: [1, 5, 11, 5] },
        timestamp: Date.now(),
        callStack: ['root', 'canPartition'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 7,
        description: 'dp[0] = true',
        variables: {
          nums: [1, 5, 11, 5],
          dp: [true, false, false, false, false, false],
        },
        timestamp: Date.now(),
        callStack: ['root', 'canPartition'],
      },
      {
        stepNumber: 2,
        type: 'assignment',
        line: 11,
        description: 'dp[t] = dp[t] || dp[t - num]',
        variables: {
          nums: [1, 5, 11, 5],
          dp: [true, true, false, false, false, true],
        },
        timestamp: Date.now(),
        callStack: ['root', 'canPartition'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('DP View'))

    expect(screen.getByText('DP View: dp')).toBeInTheDocument()
    expect(screen.getByText('dp: boolean DP table')).toBeInTheDocument()
    expect(
      screen.getByText(
        'check = true. A check mark means this index is currently reachable.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('index')).toBeInTheDocument()
    expect(screen.getByText('value')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getAllByText('true')).toHaveLength(3)
    expect(screen.getAllByText('false')).toHaveLength(3)
  })

  it('shows a vertical DP View for mutated numeric dp arrays', async () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 2,
        description: 'const dp = Array(amount + 1).fill(amount + 1)',
        variables: { dp: [0, 12, 12, 12] },
        timestamp: Date.now(),
        callStack: ['root', 'coinChange'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 7,
        description: 'dp[x] = Math.min(dp[x], dp[x - coin] + 1)',
        variables: { dp: [0, 1, 2, 3] },
        timestamp: Date.now(),
        callStack: ['root', 'coinChange'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(
      await screen.findByRole('heading', { name: 'DP View: dp' })
    ).toBeInTheDocument()
    expect(screen.getByText('dp: DP table')).toBeInTheDocument()
    expect(
      screen.getByText('Each row shows the current DP value for its index.')
    ).toBeInTheDocument()
  })

  it('shows rolling House Robber state in DP View', async () => {
    const nums = [2, 7, 9, 3, 1]
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { nums },
        timestamp: Date.now(),
        callStack: ['root', 'rob'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 11,
        description: 'prev1 = current',
        variables: { nums, prev2: 7, prev1: 11, current: 11 },
        timestamp: Date.now(),
        callStack: ['root', 'rob'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(
      await screen.findByRole('heading', { name: 'DP View: nums' })
    ).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText('nums: rolling DP state')
    ).toBeInTheDocument()
    expect(within(dialog).getByText('prev2')).toBeInTheDocument()
    expect(within(dialog).getByText('prev1')).toBeInTheDocument()
    expect(within(dialog).getByText('current')).toBeInTheDocument()
  })

  it('shows Two Sum lookup context in Map View', async () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 7,
        description: 'const complement = target - nums[i]',
        variables: {
          nums: [2, 7, 11, 15],
          target: 9,
          i: 1,
          complement: 2,
          seen: new Map([[2, 0]]),
        },
        timestamp: Date.now(),
        callStack: ['root', 'twoSum'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(
      await screen.findByRole('heading', { name: 'Map View: seen' })
    ).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('seen: lookup table')).toBeInTheDocument()
    expect(within(dialog).getByText('complement=2')).toBeInTheDocument()
    expect(
      within(dialog).getByText('match → result [0, 1]')
    ).toBeInTheDocument()
  })

  it('shows Anagram character counts in Map View', async () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 11,
        description: 'counts.set(char, next)',
        variables: {
          s: 'anagram',
          t: 'nagaram',
          char: 'n',
          counts: new Map([
            ['a', 2],
            ['n', 0],
          ]),
        },
        timestamp: Date.now(),
        callStack: ['root', 'isAnagram'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(
      await screen.findByRole('heading', { name: 'Map View: counts' })
    ).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText('counts: frequency table')
    ).toBeInTheDocument()
    expect(within(dialog).getByText('char="n"')).toBeInTheDocument()
    expect(within(dialog).getByText('active')).toBeInTheDocument()
  })

  it('prefers a derived matrix for the primary Matrix View', () => {
    const mat = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { mat, distance: undefined },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 15,
        description: 'distance initialized',
        variables: {
          mat,
          DIRS: [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
          ],
          distance: [
            [0, 0, 0],
            [0, Infinity, 0],
            [0, 0, 0],
          ],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 2,
        type: 'assignment',
        line: 36,
        description: 'distance[nr][nc] = distance[r][c] + 1',
        variables: {
          mat,
          DIRS: [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
          ],
          distance: [
            [0, 0, 0],
            [0, 7, 0],
            [0, 0, 0],
          ],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]

    const initialState = {
      ...createExecutionStateWithSteps(steps),
      currentStep: 0,
      isComplete: false,
    }
    const updatedState = {
      ...createExecutionStateWithSteps(steps),
      currentStep: 2,
      isComplete: false,
    }

    const { rerender } = render(
      <Visualizer
        executionState={initialState}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Matrix View'))

    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'Matrix: distance'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('3 × 3 Matrix')).toBeInTheDocument()
    expect(screen.getByText('∞')).toBeInTheDocument()

    rerender(
      <Visualizer
        executionState={updatedState}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('shows Graph View for derived adjacency-list graph variables', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: {
          numCourses: 4,
          prerequisites: [
            [1, 0],
            [2, 0],
            [3, 1],
            [3, 2],
          ],
        },
        timestamp: Date.now(),
        callStack: ['root', 'canFinish'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 5,
        description: 'const graph = Array.from(...)',
        variables: {
          numCourses: 4,
          prerequisites: [
            [1, 0],
            [2, 0],
            [3, 1],
            [3, 2],
          ],
          graph: [[], [], [], []],
        },
        timestamp: Date.now(),
        callStack: ['root', 'canFinish'],
      },
      {
        stepNumber: 2,
        type: 'array-mutation',
        line: 9,
        description: 'graph[prerequisite].push(course)',
        variables: {
          numCourses: 4,
          prerequisites: [
            [1, 0],
            [2, 0],
            [3, 1],
            [3, 2],
          ],
          graph: [[1, 2], [3], [3], []],
        },
        timestamp: Date.now(),
        callStack: ['root', 'canFinish'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Graph View'))

    expect(screen.getByText('Graph: graph')).toBeInTheDocument()
    expect(screen.getByText('graph (Graph)')).toBeInTheDocument()
  })

  it('treats a rectangular graph variable as an adjacency list, not a matrix', () => {
    const graph = [[1], [0]]
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { n: 2, edges: [[0, 1]] },
        timestamp: Date.now(),
        callStack: ['root', 'findMinHeightTrees'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 8,
        description: 'graph[b].push(a)',
        variables: { n: 2, edges: [[0, 1]], graph },
        timestamp: Date.now(),
        callStack: ['root', 'findMinHeightTrees'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('Graph View')).toBeInTheDocument()
    expect(screen.queryByText('Matrix View')).not.toBeInTheDocument()
    const graphRow = screen.getByText('graph').closest('.rounded-md')
    expect(graphRow).not.toBeNull()
    expect(
      within(graphRow as HTMLElement).getByTitle('Visualize as graph')
    ).toBeInTheDocument()
    expect(
      within(graphRow as HTMLElement).queryByTitle('Visualize as grid matrix')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Graph View'))

    expect(screen.getByText('Graph: graph')).toBeInTheDocument()
  })

  it('prefers a mutable input matrix over a traversal queue for Matrix View', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: {
          grid: [
            ['1', '1', '0'],
            ['1', '0', '1'],
          ],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 16,
        description: 'const queue = [[i, j]]',
        variables: {
          grid: [
            ['0', '1', '0'],
            ['1', '0', '1'],
          ],
          queue: [[0, 0]],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 2,
        type: 'array-mutation',
        line: 27,
        description: 'queue.push([nr, nc])',
        variables: {
          grid: [
            ['0', '0', '0'],
            ['0', '0', '1'],
          ],
          queue: [
            [0, 1],
            [1, 0],
          ],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Matrix View'))

    expect(
      screen.getByText((_, element) => element?.textContent === 'Matrix: grid')
    ).toBeInTheDocument()
  })

  it('tracks a mutated result matrix for the primary Matrix View', () => {
    const intervals = [
      [1, 3],
      [2, 6],
      [8, 10],
    ]
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 1,
        description: 'Function called',
        variables: { intervals },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 6,
        description: 'const result = [intervals[0]]',
        variables: {
          intervals,
          result: [[1, 3]],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 2,
        type: 'array-mutation',
        line: 16,
        description: 'result.push(current)',
        variables: {
          intervals,
          result: [
            [1, 6],
            [8, 10],
          ],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]
    const initialState = {
      ...createExecutionStateWithSteps(steps),
      currentStep: 0,
      isComplete: false,
    }
    const updatedState = {
      ...createExecutionStateWithSteps(steps),
      currentStep: 2,
      isComplete: false,
    }

    const { rerender } = render(
      <Visualizer
        executionState={initialState}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Matrix View'))

    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'Matrix: result'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('1 × 2 Matrix')).toBeInTheDocument()

    rerender(
      <Visualizer
        executionState={updatedState}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('2 × 2 Matrix')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('uses the longest linked-list variable for the primary List Graph', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 5,
        description: 'current.next = prev',
        variables: {
          head: { val: 1, next: null },
          prev: {
            val: 3,
            next: {
              val: 2,
              next: {
                val: 1,
                next: null,
              },
            },
          },
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('List Graph'))

    expect(screen.getByText('List Graph: prev')).toBeInTheDocument()
    expect(screen.getByText('prev List Graph')).toBeInTheDocument()
  })

  it('follows the primary linked-list variable as reversal advances', async () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: reverseList',
        variables: {
          head: {
            val: 1,
            next: { val: 2, next: { val: 3, next: null } },
          },
          prev: null,
        },
        timestamp: Date.now(),
        callStack: ['root', 'reverseList'],
      },
      {
        stepNumber: 1,
        type: 'return',
        line: 13,
        description: 'return from reverseList line 13: prev',
        variables: {
          head: { val: 1, next: null },
          prev: {
            val: 3,
            next: { val: 2, next: { val: 1, next: null } },
          },
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]
    const initialState: ExecutionState = {
      currentStep: 0,
      totalSteps: steps.length,
      steps,
      isComplete: false,
    }
    const { rerender } = render(
      <Visualizer
        executionState={initialState}
        isRunning={true}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('List Graph: head')).toBeInTheDocument()
    })

    rerender(
      <Visualizer
        executionState={{
          ...initialState,
          currentStep: 1,
          isComplete: true,
        }}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('List Graph: prev')).toBeInTheDocument()
    })
    expect(screen.getByText('prev List Graph')).toBeInTheDocument()
  })

  it('keeps List Graph available for a pointer variable after it becomes null', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: middleNode',
        variables: {
          fast: {
            val: 1,
            next: {
              val: 2,
              next: null,
            },
          },
        },
        timestamp: Date.now(),
        callStack: ['root', 'middleNode'],
      },
      {
        stepNumber: 1,
        type: 'return',
        line: 10,
        description: 'return from middleNode line 10: slow',
        variables: {
          fast: null,
        },
        timestamp: Date.now(),
        callStack: ['root', 'middleNode'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByTitle('Visualize as list graph'))

    expect(screen.getByText('List Graph: fast')).toBeInTheDocument()
    expect(screen.getAllByText('null').length).toBeGreaterThan(1)
  })

  it('allows result arrays to open the Stack View', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 4,
        description: 'const result = []',
        variables: {
          result: [],
          queue: [{ val: 3, left: null, right: null }],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 22,
        description: 'result.push(level)',
        variables: {
          result: [[3]],
          queue: [{ val: 3, left: null, right: null }],
        },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    const resultRow = screen.getByText('result').closest('.rounded-md')

    expect(resultRow).not.toBeNull()
    fireEvent.click(
      within(resultRow as HTMLElement).getByTitle('Visualize as stack')
    )

    expect(screen.getByText('Stack Visualization: result')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('keeps backtracking path arrays as row-level visualizations only', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 2,
        description: 'const result = []',
        variables: {
          nums: [1, 2],
          result: [[]],
          path: [],
        },
        timestamp: Date.now(),
        callStack: ['root', 'subsets'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 8,
        description: 'path.push(nums[i])',
        variables: {
          nums: [1, 2],
          result: [[], [1]],
          path: [1],
        },
        timestamp: Date.now(),
        callStack: ['root', 'subsets', 'dfs'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()

    const pathRow = screen.getByText('path').closest('.rounded-md')
    expect(pathRow).not.toBeNull()
    expect(
      within(pathRow as HTMLElement).getByTitle('Visualize as stack')
    ).toBeInTheDocument()

    const resultRow = screen.getByText('result').closest('.rounded-md')
    expect(resultRow).not.toBeNull()
    fireEvent.click(
      within(resultRow as HTMLElement).getByTitle('Visualize as stack')
    )

    expect(screen.getByText('Stack Visualization: result')).toBeInTheDocument()
  })

  it('auto-opens nested result arrays as the primary stack visualization', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 2,
        description: 'const result = []',
        variables: {
          nums: [1, 2],
          result: [[]],
          path: [],
        },
        timestamp: Date.now(),
        callStack: ['root', 'subsets'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 8,
        description: 'path.push(nums[i])',
        variables: {
          nums: [1, 2],
          result: [[], [1]],
          path: [1],
        },
        timestamp: Date.now(),
        callStack: ['root', 'subsets', 'dfs'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('Stack Visualization: result')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Bar Chart: path' })
    ).not.toBeInTheDocument()
  })

  it('shows Top K result growth instead of an inactive buckets matrix', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'variable-declaration',
        line: 7,
        description: 'const buckets = Array.from(...)',
        variables: {
          buckets: [[], [], [], []],
          result: [],
        },
        timestamp: Date.now(),
        callStack: ['root', 'topKFrequent'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 18,
        description: 'result.push(num)',
        variables: {
          buckets: [[], [3], [1, 2], []],
          result: [1, 2],
        },
        timestamp: Date.now(),
        callStack: ['root', 'topKFrequent'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Graph View')).not.toBeInTheDocument()
    expect(screen.queryByText('Matrix View')).not.toBeInTheDocument()
    expect(screen.getByText('Stack Visualization: result')).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('1')).toBeInTheDocument()
    expect(within(dialog).getByText('2')).toBeInTheDocument()
  })

  it('auto-opens TreeNode traversal result arrays as the primary stack visualization', () => {
    const root = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    }
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: rightSideView',
        variables: { root, result: [] },
        timestamp: Date.now(),
        callStack: ['root', 'rightSideView'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 8,
        description: 'result.push(node.val)',
        variables: { root, result: [1] },
        timestamp: Date.now(),
        callStack: ['root', 'rightSideView', 'dfs'],
      },
      {
        stepNumber: 2,
        type: 'array-mutation',
        line: 8,
        description: 'result.push(node.val)',
        variables: { root, result: [1, 3] },
        timestamp: Date.now(),
        callStack: ['root', 'rightSideView', 'dfs', 'dfs'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        autoOpenPrimaryVisualization
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('Stack Visualization: result')).toBeInTheDocument()
    expect(screen.queryByText('Sort Graph')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Bar Chart: result' })
    ).not.toBeInTheDocument()
  })

  it('keeps a derived traversal stack visible after the variable leaves scope', async () => {
    const root = {
      val: 2,
      left: { val: 1, left: null, right: null },
      right: { val: 3, left: null, right: null },
    }
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: kthSmallest',
        variables: { root, k: 2 },
        timestamp: Date.now(),
        callStack: ['root', 'kthSmallest'],
      },
      {
        stepNumber: 1,
        type: 'variable-declaration',
        line: 2,
        description: 'const arr = []',
        variables: { root, k: 2, arr: [] },
        timestamp: Date.now(),
        callStack: ['root', 'kthSmallest'],
      },
      {
        stepNumber: 2,
        type: 'array-mutation',
        line: 10,
        description: 'arr.push(node.val)',
        variables: { root, k: 2, arr: [1, 2, 3] },
        timestamp: Date.now(),
        callStack: ['root', 'kthSmallest', 'dfs'],
      },
      {
        stepNumber: 3,
        type: 'return',
        line: 15,
        description: 'return arr[k - 1]',
        variables: { root, k: 2 },
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ]
    const initialState: ExecutionState = {
      currentStep: 2,
      totalSteps: steps.length,
      steps,
      isComplete: false,
    }
    const visualizerProps = {
      isRunning: false,
      autoOpenPrimaryVisualization: true,
      onPause: noop,
      onRunAll: noop,
      onReset: noop,
      onStepForward: noop,
      onStepBackward: noop,
      onSkipToEnd: noop,
      onJumpToStep: noop,
    }
    const { rerender } = render(
      <Visualizer executionState={initialState} {...visualizerProps} />
    )

    await waitFor(() => {
      expect(screen.getByText('Stack Visualization: arr')).toBeInTheDocument()
    })

    rerender(
      <Visualizer
        executionState={{
          ...initialState,
          currentStep: 0,
        }}
        {...visualizerProps}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Variable is not an array')).toBeVisible()
    expect(within(dialog).queryByText('1')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('2')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('3')).not.toBeInTheDocument()

    rerender(
      <Visualizer
        executionState={{
          ...initialState,
          currentStep: 3,
          isComplete: true,
          returnValue: 2,
        }}
        {...visualizerProps}
      />
    )

    expect(within(dialog).queryByText('Variable is not an array')).toBeNull()
    expect(within(dialog).getByText('Return Value')).toBeInTheDocument()
    expect(within(dialog).getByText('1')).toBeInTheDocument()
    expect(within(dialog).getAllByText('2')).toHaveLength(2)
    expect(within(dialog).getByText('3')).toBeInTheDocument()
  })

  it('prefers result arrays over path arrays for the primary sort bar chart', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'assignment',
        line: 2,
        description: 'Entering function: sortCandidates',
        variables: {
          result: [],
          path: [],
        },
        timestamp: Date.now(),
        callStack: ['root', 'sortCandidates'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 8,
        description: 'sort result.push(nums[i])',
        variables: {
          result: [1],
          path: [1, 2],
        },
        timestamp: Date.now(),
        callStack: ['root', 'sortCandidates', 'visit'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Sort Graph'))

    expect(
      screen.getByRole('heading', { name: 'Bar Chart: result' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Bar Chart: path')).not.toBeInTheDocument()
  })

  it('hides Matrix View for result matrices and keeps result Stack View available', () => {
    const root = {
      val: 3,
      left: { val: 9, left: null, right: null },
      right: { val: 20, left: null, right: null },
    }
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: levelOrder',
        variables: { root, result: [] },
        timestamp: Date.now(),
        callStack: ['root', 'levelOrder'],
      },
      {
        stepNumber: 1,
        type: 'array-mutation',
        line: 22,
        description: 'result.push(level)',
        variables: { root, result: [[3]] },
        timestamp: Date.now(),
        callStack: ['root', 'levelOrder'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Matrix View')).not.toBeInTheDocument()
    expect(screen.queryByText('Tree Graph')).not.toBeInTheDocument()
    expect(
      screen.queryByTitle('Visualize as tree graph')
    ).not.toBeInTheDocument()

    const resultRow = screen.getByText('result').closest('.rounded-md')

    expect(resultRow).not.toBeNull()
    expect(
      within(resultRow as HTMLElement).getByTitle('Visualize as stack')
    ).toBeInTheDocument()
  })

  it('does not treat traversal cursor TreeNodes as Tree Graph targets', () => {
    const root = {
      val: 3,
      left: { val: 9, left: null, right: null },
      right: {
        val: 20,
        left: { val: 15, left: null, right: null },
        right: { val: 7, left: null, right: null },
      },
    }
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: levelOrder',
        variables: { root, result: [] },
        timestamp: Date.now(),
        callStack: ['root', 'levelOrder'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 12,
        description: 'const node = queue[head++]',
        variables: { root, result: [], node: root },
        timestamp: Date.now(),
        callStack: ['root', 'levelOrder'],
      },
      {
        stepNumber: 2,
        type: 'assignment',
        line: 12,
        description: 'const node = queue[head++]',
        variables: {
          root,
          result: [[3], [9, 20], [15, 7]],
          node: root.right.right,
        },
        timestamp: Date.now(),
        callStack: ['root', 'levelOrder'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.queryByText('Tree Graph')).not.toBeInTheDocument()
    expect(
      screen.queryByTitle('Visualize as tree graph')
    ).not.toBeInTheDocument()
  })

  it('shows the input tree for read-only TreeNode reference algorithms', () => {
    const p = { val: 2, left: null, right: null }
    const q = { val: 8, left: null, right: null }
    const root = { val: 6, left: p, right: q }
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: lowestCommonAncestor',
        variables: { root, p, q },
        timestamp: Date.now(),
        callStack: ['root', 'lowestCommonAncestor'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('Tree Graph')).toBeInTheDocument()

    const rootRow = screen.getByText('root').closest('.rounded-md')
    const pRow = screen.getByText('p').closest('.rounded-md')
    const qRow = screen.getByText('q').closest('.rounded-md')

    expect(
      within(rootRow as HTMLElement).getByTitle('Visualize as tree graph')
    ).toBeInTheDocument()
    expect(
      within(pRow as HTMLElement).queryByTitle('Visualize as tree graph')
    ).not.toBeInTheDocument()
    expect(
      within(qRow as HTMLElement).queryByTitle('Visualize as tree graph')
    ).not.toBeInTheDocument()
  })

  it('shows Tree Graph controls for TreeNode variables that change', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-entry',
        line: 1,
        description: 'Entering function: invertTree',
        variables: {
          root: {
            val: 4,
            left: { val: 2, left: null, right: null },
            right: { val: 7, left: null, right: null },
          },
        },
        timestamp: Date.now(),
        callStack: ['root', 'invertTree'],
      },
      {
        stepNumber: 1,
        type: 'assignment',
        line: 8,
        description: 'root.left = right',
        variables: {
          root: {
            val: 4,
            left: { val: 7, left: null, right: null },
            right: { val: 2, left: null, right: null },
          },
        },
        timestamp: Date.now(),
        callStack: ['root', 'invertTree'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(screen.getByText('Tree Graph')).toBeInTheDocument()
    expect(screen.getByTitle('Visualize as tree graph')).toBeInTheDocument()
  })

  it('labels class-design operation traces as call stack view', () => {
    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 0,
        description:
          'Function called with: {"__algorithmVisualizerClassDesignInput":{"className":"MinStack"}}',
        variables: {},
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 1,
        type: 'function-entry',
        line: 8,
        description: 'Entering function: push',
        variables: {
          val: 2,
        },
        timestamp: Date.now(),
        callStack: ['root', 'MinStack', 'push'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Call Stack View'))

    expect(screen.getByRole('dialog')).toHaveTextContent('Call Stack View')
    expect(screen.queryByText('Recursion Tree')).not.toBeInTheDocument()
  })

  it('opens class-design call stacks containing circular node arguments', () => {
    const node: Record<string, unknown> = { key: 1, value: 1 }
    node.prev = node

    const steps: ExecutionState['steps'] = [
      {
        stepNumber: 0,
        type: 'function-call',
        line: 0,
        description:
          'Function called with: {"__algorithmVisualizerClassDesignInput":{"className":"LRUCache"}}',
        variables: {},
        timestamp: Date.now(),
        callStack: ['root'],
      },
      {
        stepNumber: 1,
        type: 'function-entry',
        line: 24,
        description: 'Entering function: remove',
        variables: { node },
        timestamp: Date.now(),
        callStack: ['root', 'LRUCache', 'put', 'remove'],
      },
    ]

    render(
      <Visualizer
        executionState={createExecutionStateWithSteps(steps)}
        isRunning={false}
        onPause={noop}
        onRunAll={noop}
        onReset={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByText('Call Stack View'))

    expect(screen.getByRole('dialog')).toHaveTextContent('[Circular]')
  })
})
