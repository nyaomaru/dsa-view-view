import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Group,
} from '@/shared/ui'
import type { ExecutionState } from '@/entities/execution'
import type { RefObject } from 'react'
import { PlaybackControls } from './playback-controls'

const TIMELINE_WINDOW_SIZE = 50

/**
 * Props for ExecutionTimelineCard component.
 */
type ExecutionTimelineCardProps = {
  /** Full execution state used to render visible timeline steps. */
  executionState: ExecutionState
  /** Whether playback is currently running. */
  isRunning: boolean
  /** Ref for the timeline scroll container. */
  timelineRef: RefObject<HTMLDivElement | null>
  /** Ref for the current timeline step element. */
  currentStepRef: RefObject<HTMLDivElement | null>
  /** Callback to pause playback. */
  onPause: () => void
  /** Callback to start or restart playback. */
  onStart: () => void
  /** Callback to reset playback to the first step. */
  onReset: () => void
  /** Callback to advance one execution step. */
  onStepForward: () => void
  /** Callback to move back one execution step. */
  onStepBackward: () => void
  /** Callback to jump to the final execution step. */
  onSkipToEnd: () => void
}

export function ExecutionTimelineCard({
  executionState,
  isRunning,
  timelineRef,
  currentStepRef,
  onPause,
  onStart,
  onReset,
  onStepForward,
  onStepBackward,
  onSkipToEnd,
}: ExecutionTimelineCardProps) {
  const half = Math.floor(TIMELINE_WINDOW_SIZE / 2)
  const total = executionState.steps.length
  const current = executionState.currentStep
  const start = Math.max(
    0,
    Math.min(current - half, total - TIMELINE_WINDOW_SIZE)
  )
  const end = Math.min(total, start + TIMELINE_WINDOW_SIZE)
  const visibleSteps = executionState.steps.slice(start, end)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Execution Timeline</span>
          <PlaybackControls
            executionState={executionState}
            isRunning={isRunning}
            onPause={onPause}
            onStart={onStart}
            onReset={onReset}
            onStepForward={onStepForward}
            onStepBackward={onStepBackward}
            onSkipToEnd={onSkipToEnd}
          />
        </CardTitle>
        <CardDescription>All execution steps</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={timelineRef}
          className="max-h-32 overflow-x-auto overflow-y-auto"
        >
          <div className="min-w-[42rem] space-y-1 pr-2">
            {start > 0 && (
              <div className="text-xs text-muted-foreground/50 text-center py-1">
                ... {start.toLocaleString()} earlier steps
              </div>
            )}
            {visibleSteps.map((step, indexOffset) => {
              const index = start + indexOffset
              const isCurrent = index === current

              return (
                <div
                  key={index}
                  ref={isCurrent ? currentStepRef : null}
                  className={`p-2 rounded-md text-sm ${
                    isCurrent
                      ? 'bg-primary text-timeline-current-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <Group spacing="xs" align="center">
                    <span className="font-mono text-xs">
                      #{step.stepNumber}
                    </span>
                    <Badge
                      variant={isCurrent ? 'outline' : 'outline'}
                      className={
                        isCurrent
                          ? 'timeline-step-badge--current text-timeline-current-foreground text-xs'
                          : 'text-xs'
                      }
                    >
                      {step.type}
                    </Badge>
                    <span className="min-w-0 flex-1 whitespace-nowrap">
                      {step.description}
                    </span>
                  </Group>
                </div>
              )
            })}
            {end < total && (
              <div className="text-xs text-muted-foreground/50 text-center py-1">
                ... {(total - end).toLocaleString()} more steps
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
