import {
  FastForward,
  Play,
  Rewind,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import type { ExecutionState } from '@/entities/execution'

type PlaybackControlsProps = {
  /** Execution state used to determine button disabled states. */
  executionState: ExecutionState
  /** Whether playback is currently running. */
  isRunning: boolean
  /** Callback to pause playback. */
  onPause: () => void
  /** Callback to start or resume playback. */
  onStart: () => void
  /** Callback to reset playback to the first step. */
  onReset: () => void
  /** Callback to advance one execution step. */
  onStepForward: () => void
  /** Callback to move back one execution step. */
  onStepBackward: () => void
  /** Callback to jump to the final execution step. */
  onSkipToEnd: () => void
  /** Additional classes for the control row. */
  className?: string
}

export function PlaybackControls({
  executionState,
  isRunning,
  onPause,
  onStart,
  onReset,
  onStepForward,
  onStepBackward,
  onSkipToEnd,
  className,
}: PlaybackControlsProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={isRunning || executionState.currentStep === 0}
        className="h-8 w-8 p-0"
        title="Skip to Start"
      >
        <Rewind className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onStepBackward}
        disabled={isRunning || executionState.currentStep === 0}
        className="h-8 w-8 p-0"
        title="Step Backward"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {isRunning ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          className="h-8 w-8 p-0"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onStart}
          className="h-8 w-8 p-0"
        >
          <Play className="h-4 w-4" fill="currentColor" />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onStepForward}
        disabled={isRunning || executionState.isComplete}
        className="h-8 w-8 p-0"
        title="Step Forward"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSkipToEnd}
        disabled={isRunning || executionState.isComplete}
        className="h-8 w-8 p-0"
        title="Skip to End"
      >
        <FastForward className="h-4 w-4" />
      </Button>
    </div>
  )
}
