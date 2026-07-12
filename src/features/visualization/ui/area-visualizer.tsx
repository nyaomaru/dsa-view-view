import { Card } from '@/shared/ui'
import { pxToRem } from '@/shared/lib/units'
import type { AreaViewPointerState } from '../lib/area-view'
import type { ReactNode } from 'react'

const MAX_CHART_HEIGHT = 280
const MIN_BAR_HEIGHT = 4
const CHART_COLUMN_TEMPLATE_MIN = 'minmax(2rem, 1fr)'
const LABEL_CELL_CLASS =
  'min-w-8 text-center font-mono text-xs text-muted-foreground'
const BOUNDARY_LABEL_CELL_CLASS =
  'h-6 min-w-8 text-center font-mono text-xs font-bold text-primary'
const INDEX_LABEL_CELL_CLASS =
  'h-6 min-w-8 text-center font-mono text-xs text-muted-foreground'

type AreaVisualizerProps = {
  /** Numeric height array used by the container-area view. */
  data: number[]
  /** Variable name displayed in the visualizer title. */
  name: string
  /** Current two-pointer area state. */
  areaState: AreaViewPointerState
}

function getMarkerLabel(
  index: number,
  areaState: AreaViewPointerState
): string {
  if (index === areaState.leftIndex) return 'L'
  if (index === areaState.rightIndex) return 'R'

  return String(index)
}

function isBoundaryIndex(
  index: number,
  areaState: AreaViewPointerState
): boolean {
  return index === areaState.leftIndex || index === areaState.rightIndex
}

function AreaStat({
  children,
  emphasized = false,
}: {
  /** Inline statistic content. */
  children: ReactNode
  /** Whether to render the statistic with emphasized styling. */
  emphasized?: boolean
}) {
  return (
    <span
      className={[
        'rounded-sm border px-2 py-1',
        emphasized ? 'bg-secondary text-secondary-foreground' : 'bg-background',
      ].join(' ')}
    >
      {children}
    </span>
  )
}

function AreaGridLabels({
  values,
  columnTemplate,
}: {
  /** Label values to render under the chart columns. */
  values: Array<number | string>
  /** CSS grid-template-columns value matching the chart columns. */
  columnTemplate: string
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: columnTemplate }}>
      {values.map((value, index) => (
        <div key={index} className={LABEL_CELL_CLASS}>
          {value}
        </div>
      ))}
    </div>
  )
}

export function AreaVisualizer({ data, name, areaState }: AreaVisualizerProps) {
  const maxValue = Math.max(...data, 1)
  const leftPercent = (areaState.leftIndex / data.length) * 100
  const rightPercent =
    ((data.length - areaState.rightIndex - 1) / data.length) * 100
  const areaHeightPercent =
    areaState.mode === 'container'
      ? (areaState.currentHeight / maxValue) * 100
      : 0
  const columnTemplate = `repeat(${data.length}, ${CHART_COLUMN_TEMPLATE_MIN})`
  const markerLabels = data.map((_, index) => getMarkerLabel(index, areaState))

  return (
    <Card className="h-full border-0 shadow-none">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-mono text-lg font-semibold text-muted-foreground">
            {areaState.mode === 'rain-water' ? 'Rain Water View' : 'Area View'}:{' '}
            {name}
          </h3>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <AreaStat>L={areaState.leftIndex}</AreaStat>
            <AreaStat>R={areaState.rightIndex}</AreaStat>
            {areaState.mode === 'container' ? (
              <>
                <AreaStat emphasized>area={areaState.currentArea}</AreaStat>
                {areaState.bestArea !== undefined && (
                  <AreaStat>best={areaState.bestArea}</AreaStat>
                )}
              </>
            ) : (
              <>
                <AreaStat>leftMax={areaState.leftMax}</AreaStat>
                <AreaStat>rightMax={areaState.rightMax}</AreaStat>
                <AreaStat emphasized>water={areaState.totalWater}</AreaStat>
              </>
            )}
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-max px-4 pb-2">
            <div className="mb-2">
              <AreaGridLabels values={data} columnTemplate={columnTemplate} />
            </div>
            <div
              className="relative grid items-end gap-2 border-b border-muted-foreground/30"
              style={{
                height: pxToRem(MAX_CHART_HEIGHT),
                gridTemplateColumns: columnTemplate,
              }}
            >
              {areaState.mode === 'container' && (
                <div
                  className="pointer-events-none absolute bottom-0 border-2 border-primary/80 bg-primary/20"
                  style={{
                    left: `${leftPercent}%`,
                    right: `${rightPercent}%`,
                    height: `${areaHeightPercent}%`,
                  }}
                />
              )}
              {data.map((value, index) => {
                const barHeightPercent = (value / maxValue) * 100
                const waterHeightPercent =
                  areaState.mode === 'rain-water'
                    ? (areaState.waterDepths[index] / maxValue) * 100
                    : 0
                const isBoundary = isBoundaryIndex(index, areaState)

                return (
                  <div
                    key={index}
                    className="relative z-10 flex h-full min-w-8 items-end"
                  >
                    <div
                      className={[
                        'w-full rounded-t-sm border transition-colors',
                        isBoundary
                          ? 'border-primary bg-primary'
                          : 'border-primary/20 bg-primary/70',
                      ].join(' ')}
                      style={{
                        height: `${Math.max(barHeightPercent, MIN_BAR_HEIGHT)}%`,
                      }}
                    />
                    {waterHeightPercent > 0 && (
                      <div
                        aria-label={`Water at index ${index}: ${areaState.mode === 'rain-water' ? areaState.waterDepths[index] : 0}`}
                        className="absolute inset-x-0 border-x border-t border-sky-500/70 bg-sky-400/40"
                        style={{
                          bottom: `${barHeightPercent}%`,
                          height: `${waterHeightPercent}%`,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div
              className="mt-2 grid gap-2"
              style={{ gridTemplateColumns: columnTemplate }}
            >
              {markerLabels.map((label, index) => (
                <div
                  key={index}
                  className={
                    isBoundaryIndex(index, areaState)
                      ? BOUNDARY_LABEL_CELL_CLASS
                      : INDEX_LABEL_CELL_CLASS
                  }
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
