import * as React from 'react'
import { cn } from '@/shared/lib/class-names'

const DEFAULT_SLIDER_MIN = 0
const DEFAULT_SLIDER_MAX = 100
const DEFAULT_SLIDER_STEP = 1

/**
 * Props for Slider component.
 */
interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Current numeric slider value. */
  value: number
  /** Callback when the slider value changes. */
  onValueChange: (value: number) => void
  /** Minimum slider value. */
  min?: number
  /** Maximum slider value. */
  max?: number
  /** Slider step size. */
  step?: number
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      onValueChange,
      min = DEFAULT_SLIDER_MIN,
      max = DEFAULT_SLIDER_MAX,
      step = DEFAULT_SLIDER_STEP,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          className
        )}
      >
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className={cn(
            'pixel-slider h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = 'Slider'
