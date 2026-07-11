import { lazy, Suspense } from 'react'
import type { RuntimeTabContentProps } from '../model/types'

const Controls = lazy(() =>
  import('@/features/code-execution/controls').then((module) => ({
    default: module.Controls,
  }))
)
const Visualizer = lazy(() =>
  import('@/features/visualization/visualizer').then((module) => ({
    default: module.Visualizer,
  }))
)

export function RuntimeTabContent({
  executionState,
  isRunning,
  playbackInterval,
  onPlaybackIntervalChange,
  onStepForward,
  onStepBackward,
  onRunAll,
  onPause,
  onResetToStart,
  onSkipToEnd,
  onJumpToStep,
  autoOpenPrimaryVisualization,
}: RuntimeTabContentProps) {
  if (!executionState) return null

  return (
    <div className="flex h-auto flex-col space-y-6 p-6 lg:h-full">
      <Suspense fallback={null}>
        <Controls
          onStepForward={onStepForward}
          onStepBackward={onStepBackward}
          onRunAll={onRunAll}
          onPause={onPause}
          onSkipToEnd={onSkipToEnd}
          onResetToStart={onResetToStart}
          isRunning={isRunning}
          isComplete={executionState.isComplete}
          currentStep={executionState.currentStep}
          playbackInterval={playbackInterval}
          onPlaybackIntervalChange={onPlaybackIntervalChange}
        />
      </Suspense>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Suspense fallback={null}>
          <Visualizer
            executionState={executionState}
            isRunning={isRunning}
            autoOpenPrimaryVisualization={autoOpenPrimaryVisualization}
            onPause={onPause}
            onRunAll={onRunAll}
            onReset={onResetToStart}
            onStepForward={onStepForward}
            onStepBackward={onStepBackward}
            onSkipToEnd={onSkipToEnd}
            onJumpToStep={onJumpToStep}
          />
        </Suspense>
      </div>
    </div>
  )
}
