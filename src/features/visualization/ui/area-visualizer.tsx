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
const STACK_LABEL_CELL_CLASS =
  'h-6 min-w-8 text-center font-mono text-xs font-bold text-amber-600 dark:text-amber-400'
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
  if (areaState.mode === 'histogram') {
    if (index === areaState.currentIndex) return 'I'
    if (index === areaState.rectangle?.poppedIndex) return 'M'

    const stackPosition = areaState.stackIndices.indexOf(index)
    return stackPosition >= 0 ? `S${stackPosition}` : String(index)
  }

  if (index === areaState.leftIndex) return 'L'
  if (index === areaState.rightIndex) return 'R'

  return String(index)
}

function isPrimaryIndex(
  index: number,
  areaState: AreaViewPointerState
): boolean {
  if (areaState.mode === 'histogram') {
    return (
      index === areaState.currentIndex ||
      index === areaState.rectangle?.poppedIndex
    )
  }

  return index === areaState.leftIndex || index === areaState.rightIndex
}

function isStackIndex(index: number, areaState: AreaViewPointerState): boolean {
  return (
    areaState.mode === 'histogram' && areaState.stackIndices.includes(index)
  )
}

function getViewTitle(areaState: AreaViewPointerState): string {
  switch (areaState.mode) {
    case 'rain-water':
      return 'Rain Water View'
    case 'histogram':
      return 'Rectangle Area View'
    case 'container':
      return 'Area View'
  }
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
  const rectangle =
    areaState.mode === 'container'
      ? {
          leftIndex: areaState.leftIndex,
          rightIndex: areaState.rightIndex,
          height: areaState.currentHeight,
          area: areaState.currentArea,
        }
      : areaState.mode === 'histogram'
        ? areaState.rectangle
        : undefined
  const leftPercent = rectangle ? (rectangle.leftIndex / data.length) * 100 : 0
  const rightPercent = rectangle
    ? ((data.length - rectangle.rightIndex - 1) / data.length) * 100
    : 0
  const areaHeightPercent = rectangle ? (rectangle.height / maxValue) * 100 : 0
  const columnTemplate = `repeat(${data.length}, ${CHART_COLUMN_TEMPLATE_MIN})`
  const markerLabels = data.map((_, index) => getMarkerLabel(index, areaState))

  return (
    <Card className="h-full border-0 shadow-none">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-mono text-lg font-semibold text-muted-foreground">
              {getViewTitle(areaState)}: {name}
            </h3>
            {areaState.mode === 'histogram' && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                I=current · S=stack position · M=popped bar
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {areaState.mode === 'container' ? (
              <>
                <AreaStat>L={areaState.leftIndex}</AreaStat>
                <AreaStat>R={areaState.rightIndex}</AreaStat>
                <AreaStat emphasized>area={areaState.currentArea}</AreaStat>
                {areaState.bestArea !== undefined && (
                  <AreaStat>best={areaState.bestArea}</AreaStat>
                )}
              </>
            ) : areaState.mode === 'rain-water' ? (
              <>
                <AreaStat>L={areaState.leftIndex}</AreaStat>
                <AreaStat>R={areaState.rightIndex}</AreaStat>
                <AreaStat>leftMax={areaState.leftMax}</AreaStat>
                <AreaStat>rightMax={areaState.rightMax}</AreaStat>
                <AreaStat emphasized>water={areaState.totalWater}</AreaStat>
              </>
            ) : (
              <>
                <AreaStat>i={areaState.currentIndex}</AreaStat>
                <AreaStat>stack=[{areaState.stackIndices.join(', ')}]</AreaStat>
                {areaState.rectangle && (
                  <>
                    <AreaStat>mid={areaState.rectangle.poppedIndex}</AreaStat>
                    <AreaStat>width={areaState.rectangle.width}</AreaStat>
                    <AreaStat emphasized>
                      area={areaState.rectangle.area}
                    </AreaStat>
                  </>
                )}
                <AreaStat>best={areaState.bestArea}</AreaStat>
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
              {rectangle && (
                <div
                  aria-label={
                    areaState.mode === 'histogram'
                      ? `Current rectangle: indexes ${rectangle.leftIndex} through ${rectangle.rightIndex}, height ${rectangle.height}, area ${rectangle.area}`
                      : `Current area: ${rectangle.area}`
                  }
                  className={[
                    'pointer-events-none absolute bottom-0 border-2',
                    areaState.mode === 'histogram'
                      ? 'border-amber-500/90 bg-amber-400/20'
                      : 'border-primary/80 bg-primary/20',
                  ].join(' ')}
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
                const isPrimary = isPrimaryIndex(index, areaState)
                const isStacked = isStackIndex(index, areaState)

                return (
                  <div
                    key={index}
                    className="relative z-10 flex h-full min-w-8 items-end"
                  >
                    <div
                      className={[
                        'w-full rounded-t-sm border transition-colors',
                        isPrimary
                          ? 'border-primary bg-primary'
                          : isStacked
                            ? 'border-amber-500 bg-amber-400/80'
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
                    isPrimaryIndex(index, areaState)
                      ? BOUNDARY_LABEL_CELL_CLASS
                      : isStackIndex(index, areaState)
                        ? STACK_LABEL_CELL_CLASS
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
