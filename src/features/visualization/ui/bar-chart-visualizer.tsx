import { Card } from '@/shared/ui'
import { pxToRem } from '@/shared/lib/units'

/**
 * Constants for bar chart visualization layout
 */
const VISUALIZATION_CONFIG = {
  MAX_TOTAL_HEIGHT: 300,
  LABEL_BUFFER: 50,
  BASE_UNIT_SIZE: 24,
  MIN_UNIT_SIZE_FOR_GRID: 8,
  MIN_BAR_VISIBILITY_PX: 4,
} as const

/**
 * Props for BarChartVisualizer component.
 */
type BarChartVisualizerProps = {
  /** Array of numbers to visualize */
  data: number[]
  /** Variable name being visualized */
  name: string
}

/**
 * Bar chart component for visualizing 1D numeric arrays.
 *
 * Features:
 * - "Unit-based" scaling: Tries to render 1 unit as a square (BASE_UNIT_SIZE)
 * - Responsive: Scales down unit size if total height exceeds MAX_TOTAL_HEIGHT
 * - Adaptive grid: Shows horizontal grid lines if unit size is large enough
 */
export function BarChartVisualizer({ data, name }: BarChartVisualizerProps) {
  const maxValue = Math.max(...data, 1) // Avoid division by zero

  const {
    MAX_TOTAL_HEIGHT,
    LABEL_BUFFER,
    BASE_UNIT_SIZE,
    MIN_UNIT_SIZE_FOR_GRID,
    MIN_BAR_VISIBILITY_PX,
  } = VISUALIZATION_CONFIG

  const MAX_BAR_HEIGHT = MAX_TOTAL_HEIGHT - LABEL_BUFFER

  const idealBarHeight = maxValue * BASE_UNIT_SIZE
  const scaleFactor =
    idealBarHeight > MAX_BAR_HEIGHT ? MAX_BAR_HEIGHT / idealBarHeight : 1

  const currentUnitSize = BASE_UNIT_SIZE * scaleFactor
  // Container must hold the tallest bar + labels
  const containerHeight =
    Math.min(idealBarHeight, MAX_BAR_HEIGHT) + LABEL_BUFFER

  // Only show grid lines if unit size is large enough to be distinguishable
  const showGridLines = currentUnitSize >= MIN_UNIT_SIZE_FOR_GRID

  return (
    <Card className="h-full border-0 shadow-none">
      <div className="p-4 h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold mb-6 font-mono text-muted-foreground">
          {name}: [{data.join(', ')}]
        </h3>
        <div className="w-full h-full max-h-[25rem] overflow-x-auto overflow-y-hidden flex items-end">
          <div
            className="flex items-end justify-center min-w-max gap-2 px-4 mb-4 mx-auto transition-all duration-300"
            style={{ height: pxToRem(containerHeight) }}
          >
            {data.map((value, index) => {
              const barHeight = value * currentUnitSize

              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 group flex-1 min-w-[1.875rem]"
                >
                  <div className="text-xs text-muted-foreground font-mono opacity-100 group-hover:font-bold transition-all">
                    {value}
                  </div>
                  <div
                    className="w-full bg-primary/90 hover:bg-primary transition-all rounded-t-sm relative border border-primary-foreground/20 overflow-hidden"
                    style={{
                      height: pxToRem(
                        Math.max(barHeight, MIN_BAR_VISIBILITY_PX)
                      ),
                      // Create "Massu" (square) effect with repeating gradient check
                      backgroundImage: showGridLines
                        ? 'linear-gradient(to bottom, transparent calc(100% - 0.0625rem), rgb(var(--bar-grid-line) / 0.3) calc(100% - 0.0625rem))'
                        : 'none',
                      backgroundSize: `100% ${pxToRem(currentUnitSize)}`,
                    }}
                  ></div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {index}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
