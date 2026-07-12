import { useEffect, useRef } from 'react'
import { Button, Group, Block, Slider, Label } from '@/shared/ui'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Timer,
} from 'lucide-react'
import { EXECUTION_CONSTANTS } from '../model/constants'

const {
  EXECUTION_INTERVAL_MS,
  MIN_PLAYBACK_SPEED,
  MAX_PLAYBACK_SPEED,
  PLAYBACK_SLIDER_MIN,
  PLAYBACK_SLIDER_MAX,
  PLAYBACK_SLIDER_CENTER,
  PLAYBACK_SLIDER_STEP,
  PLAYBACK_RESTART_DELAY_MS,
} = EXECUTION_CONSTANTS

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const roundToStep = (value: number, step: number): number =>
  Math.round(value / step) * step

const intervalToSliderValue = (interval: number): number => {
  const clampedInterval = clamp(
    interval,
    MIN_PLAYBACK_SPEED,
    MAX_PLAYBACK_SPEED
  )

  if (clampedInterval >= EXECUTION_INTERVAL_MS) {
    const slowRange = MAX_PLAYBACK_SPEED - EXECUTION_INTERVAL_MS
    const progress =
      slowRange === 0 ? 1 : (MAX_PLAYBACK_SPEED - clampedInterval) / slowRange
    return (
      PLAYBACK_SLIDER_MIN +
      progress * (PLAYBACK_SLIDER_CENTER - PLAYBACK_SLIDER_MIN)
    )
  }

  const fastRange = EXECUTION_INTERVAL_MS - MIN_PLAYBACK_SPEED
  const progress =
    fastRange === 0 ? 1 : (EXECUTION_INTERVAL_MS - clampedInterval) / fastRange
  return (
    PLAYBACK_SLIDER_CENTER +
    progress * (PLAYBACK_SLIDER_MAX - PLAYBACK_SLIDER_CENTER)
  )
}

const sliderValueToInterval = (sliderValue: number): number => {
  const clampedSliderValue = clamp(
    sliderValue,
    PLAYBACK_SLIDER_MIN,
    PLAYBACK_SLIDER_MAX
  )

  if (clampedSliderValue <= PLAYBACK_SLIDER_CENTER) {
    const progress =
      (clampedSliderValue - PLAYBACK_SLIDER_MIN) /
      (PLAYBACK_SLIDER_CENTER - PLAYBACK_SLIDER_MIN)
    return (
      MAX_PLAYBACK_SPEED -
      progress * (MAX_PLAYBACK_SPEED - EXECUTION_INTERVAL_MS)
    )
  }

  const progress =
    (clampedSliderValue - PLAYBACK_SLIDER_CENTER) /
    (PLAYBACK_SLIDER_MAX - PLAYBACK_SLIDER_CENTER)
  return (
    EXECUTION_INTERVAL_MS -
    progress * (EXECUTION_INTERVAL_MS - MIN_PLAYBACK_SPEED)
  )
}

/**
 * Props for Controls component
 */
type ControlsProps = {
  /** Whether execution is currently running */
  isRunning: boolean
  /** Whether execution is complete */
  isComplete: boolean
  /** Current step index */
  currentStep: number
  /** Current playback interval in ms */
  playbackInterval: number
  /** Callback to change playback interval */
  onPlaybackIntervalChange: (value: number) => void
  /** Callback to step forward */
  onStepForward: () => void
  /** Callback to step backward */
  onStepBackward: () => void
  /** Callback to run all steps */
  onRunAll: () => void
  /** Callback to pause execution */
  onPause: () => void
  /** Callback to skip to end */
  onSkipToEnd: () => void
  /** Callback to reset to start for replay */
  onResetToStart: () => void
}

/**
 * Control panel for step-by-step execution
 *
 * Provides buttons to control execution flow: step forward/backward,
 * run all, pause, and skip.
 *
 * @param props - Component props
 * @returns Controls component
 */
export function Controls({
  isRunning,
  isComplete,
  currentStep,
  playbackInterval,
  onPlaybackIntervalChange,
  onStepForward,
  onStepBackward,
  onRunAll,
  onPause,
  onSkipToEnd,
  onResetToStart,
}: ControlsProps) {
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (restartTimerRef.current !== null) {
        clearTimeout(restartTimerRef.current)
      }
    },
    []
  )

  // Handler for Start button - resets to beginning and plays if complete
  const handleStartClick = () => {
    if (isComplete) {
      // Reset to first step and start playing
      onResetToStart()
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null
        onRunAll()
      }, PLAYBACK_RESTART_DELAY_MS)
    } else {
      onRunAll()
    }
  }

  return (
    <Block
      padding="md"
      className="pixel-panel overflow-hidden border bg-card space-y-4"
    >
      <Group spacing="sm" justify="between" align="center">
        <Group spacing="sm">
          <Button
            variant="outline"
            size="icon"
            onClick={onResetToStart}
            disabled={isRunning || currentStep === 0}
            title="Skip to Start"
            className="h-8 w-8"
          >
            <Rewind className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onStepBackward}
            disabled={isRunning || currentStep === 0}
            title="Step Backward"
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
        </Group>

        <Group spacing="sm">
          {isRunning ? (
            <Button
              variant="outline"
              size="icon"
              onClick={onPause}
              title="Pause"
              className="h-10 w-10 border-primary text-primary"
            >
              <Pause className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handleStartClick}
              title="Run All"
              className="h-10 w-10 shadow-md"
            >
              <Play className="h-5 w-5" />
            </Button>
          )}
        </Group>

        <Group spacing="sm">
          <Button
            variant="outline"
            size="icon"
            onClick={onStepForward}
            disabled={isRunning || isComplete}
            title="Step Forward"
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onSkipToEnd}
            disabled={isRunning || isComplete}
            title="Skip to End"
            className="h-8 w-8"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </Group>
      </Group>

      <div className="space-y-2 pt-2 border-t border-muted">
        <div className="flex items-center justify-between">
          <Label className="text-[0.625rem] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
            <Timer className="w-3 h-3" />
            Playback Interval
          </Label>
          <span className="text-[0.625rem] font-mono text-secondary-foreground bg-secondary px-1.5 py-0.5 rounded">
            {playbackInterval}ms
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.625rem] text-muted-foreground font-medium">
            Slow
          </span>
          <Slider
            min={PLAYBACK_SLIDER_MIN}
            max={PLAYBACK_SLIDER_MAX}
            step={PLAYBACK_SLIDER_STEP}
            value={intervalToSliderValue(playbackInterval)}
            onValueChange={(uiValue) => {
              const newInterval = roundToStep(
                sliderValueToInterval(uiValue),
                PLAYBACK_SLIDER_STEP
              )
              onPlaybackIntervalChange(newInterval)
            }}
            className="flex-1"
          />
          <span className="text-[0.625rem] text-muted-foreground font-medium">
            Fast
          </span>
        </div>
      </div>
    </Block>
  )
}
