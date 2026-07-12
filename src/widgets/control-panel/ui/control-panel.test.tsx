import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { ControlPanel } from './control-panel'

const noop = () => {}

const getPresentationSources = () =>
  screen
    .getAllByRole('presentation', { hidden: true })
    .map((element) => element.getAttribute('src'))

describe('ControlPanel', () => {
  it('shows the logo card above the tab controls', () => {
    const { rerender } = render(
      <ControlPanel
        mode="editor"
        compilationResult={null}
        lintErrors={[]}
        functionSignature={null}
        executionState={null}
        isRunning={false}
        playbackInterval={500}
        algorithmExamples={[{ id: 'two-sum', label: 'Two Sum' }]}
        selectedExampleId="two-sum"
        viewViewAnimationSrc="/view-view-animation/thinking.gif"
        onModeChange={noop}
        onExampleChange={noop}
        onCompile={noop}
        onRunCode={noop}
        onVerificationInputChange={noop}
        onPlaybackIntervalChange={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onRunAll={noop}
        onPause={noop}
        onResetToStart={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(getPresentationSources()).toContain('/TV moniter.png')
    expect(getPresentationSources()).toContain('/view-view-animation/wait.png')

    const animation = screen.getByRole('img', { name: 'View View animation' })
    const tabs = screen.getByRole('tablist')

    expect(animation).toHaveAttribute(
      'src',
      '/view-view-animation/thinking.gif'
    )
    expect(
      animation.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(animation.parentElement).toHaveClass('absolute')
    expect(animation.parentElement).toHaveClass('left-[8%]')
    expect(animation.parentElement).toHaveClass('top-[27%]')
    expect(animation.parentElement).toHaveClass('h-[57%]')
    expect(animation.parentElement).toHaveClass('w-[78%]')
    expect(animation).toHaveClass('h-full')
    expect(getPresentationSources()).toContain('/view-view-animation/wait.png')

    fireEvent.load(animation)

    expect(getPresentationSources()).not.toContain(
      '/view-view-animation/wait.png'
    )
    expect(screen.getByText('Example')).toBeInTheDocument()
    expect(screen.getByText('Two Sum')).toBeInTheDocument()

    rerender(
      <ControlPanel
        mode="editor"
        compilationResult={null}
        lintErrors={[]}
        functionSignature={null}
        executionState={null}
        isRunning={false}
        playbackInterval={500}
        algorithmExamples={[{ id: 'two-sum', label: 'Two Sum' }]}
        selectedExampleId="two-sum"
        viewViewAnimationSrc={null}
        onModeChange={noop}
        onExampleChange={noop}
        onCompile={noop}
        onRunCode={noop}
        onVerificationInputChange={noop}
        onPlaybackIntervalChange={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onRunAll={noop}
        onPause={noop}
        onResetToStart={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(getPresentationSources()).toContain(
      '/view-view-animation/TV-moniter.gif'
    )
    expect(
      screen.queryByRole('img', { name: 'View View animation' })
    ).not.toBeInTheDocument()

    rerender(
      <ControlPanel
        mode="editor"
        compilationResult={null}
        lintErrors={[]}
        functionSignature={null}
        executionState={null}
        isRunning={false}
        playbackInterval={500}
        algorithmExamples={[{ id: 'two-sum', label: 'Two Sum' }]}
        selectedExampleId="two-sum"
        viewViewAnimationSrc="/view-view-animation/TV noise.gif"
        onModeChange={noop}
        onExampleChange={noop}
        onCompile={noop}
        onRunCode={noop}
        onVerificationInputChange={noop}
        onPlaybackIntervalChange={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onRunAll={noop}
        onPause={noop}
        onResetToStart={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    expect(getPresentationSources()).toContain('/TV moniter.png')
    expect(getPresentationSources()).toContain('/view-view-animation/wait.png')
    expect(getPresentationSources()).toContain(
      '/view-view-animation/TV noise.gif'
    )
    expect(
      screen.queryByRole('img', { name: 'View View animation' })
    ).not.toBeInTheDocument()
  })

  it('filters examples and shows category labels', () => {
    render(
      <ControlPanel
        mode="editor"
        compilationResult={null}
        lintErrors={[]}
        functionSignature={null}
        executionState={null}
        isRunning={false}
        playbackInterval={500}
        algorithmExamples={[
          { id: 'two-sum', label: 'Two Sum', category: 'Hash Map' },
          {
            id: 'container-with-most-water',
            label: 'Container With Most Water',
            category: 'Two Pointers',
          },
          {
            id: 'invert-binary-tree',
            label: 'Invert Binary Tree',
            category: 'Binary Tree',
          },
        ]}
        selectedExampleId="two-sum"
        viewViewAnimationSrc={null}
        onModeChange={noop}
        onExampleChange={noop}
        onCompile={noop}
        onRunCode={noop}
        onVerificationInputChange={noop}
        onPlaybackIntervalChange={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onRunAll={noop}
        onPause={noop}
        onResetToStart={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'Example' }))
    fireEvent.change(screen.getByLabelText('Search examples'), {
      target: { value: 'tree' },
    })

    expect(screen.getByText('Binary Tree')).toBeInTheDocument()
    expect(screen.getByText('Invert Binary Tree')).toBeInTheDocument()
    expect(
      screen.queryByText('Container With Most Water')
    ).not.toBeInTheDocument()
  })

  it('supports fuzzy example search with initials and skipped characters', () => {
    render(
      <ControlPanel
        mode="editor"
        compilationResult={null}
        lintErrors={[]}
        functionSignature={null}
        executionState={null}
        isRunning={false}
        playbackInterval={500}
        algorithmExamples={[
          { id: 'two-sum', label: 'Two Sum', category: 'Hash Map' },
          {
            id: 'container-with-most-water',
            label: 'Container With Most Water',
            category: 'Two Pointers',
          },
          {
            id: 'invert-binary-tree',
            label: 'Invert Binary Tree',
            category: 'Binary Tree',
          },
        ]}
        selectedExampleId="two-sum"
        viewViewAnimationSrc={null}
        onModeChange={noop}
        onExampleChange={noop}
        onCompile={noop}
        onRunCode={noop}
        onVerificationInputChange={noop}
        onPlaybackIntervalChange={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onRunAll={noop}
        onPause={noop}
        onResetToStart={noop}
        onSkipToEnd={noop}
        onJumpToStep={noop}
      />
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'Example' }))

    fireEvent.change(screen.getByLabelText('Search examples'), {
      target: { value: 'cwmw' },
    })
    expect(screen.getByText('Container With Most Water')).toBeInTheDocument()
    expect(screen.queryByText('Invert Binary Tree')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search examples'), {
      target: { value: 'ibt' },
    })
    expect(screen.getByText('Invert Binary Tree')).toBeInTheDocument()
    expect(
      screen.queryByText('Container With Most Water')
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search examples'), {
      target: { value: 'cnt water' },
    })
    expect(screen.getByText('Container With Most Water')).toBeInTheDocument()
    expect(screen.queryByText('Invert Binary Tree')).not.toBeInTheDocument()
  })
})
