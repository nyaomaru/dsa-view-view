import { Card } from '@/shared/ui'
import type { JumpGameVisualizationState } from '../lib/jump-game-view'

type JumpGameVisualizerProps = {
  /** Source jump-length array variable name. */
  name: string
  /** Current greedy range-expansion state. */
  state: JumpGameVisualizationState
}

function Metric({
  label,
  variableName,
  value,
  emphasized = false,
}: {
  label: string
  variableName: string
  value: number
  emphasized?: boolean
}) {
  return (
    <div
      className={[
        'min-w-36 rounded-md border px-3 py-2',
        emphasized
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-muted/30',
      ].join(' ')}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3 font-mono">
        <span className="truncate text-xs text-muted-foreground">
          {variableName}
        </span>
        <strong className="text-lg text-foreground">{value}</strong>
      </div>
    </div>
  )
}

function getCellStatus({
  index,
  state,
}: {
  index: number
  state: JumpGameVisualizationState
}): string {
  const lastIndex = state.data.length - 1
  const farthest = Math.min(state.farthest, lastIndex)

  if (index === state.currentIndex && index === state.currentEnd) {
    return 'current · boundary'
  }
  if (index === state.currentIndex) return 'current'
  if (index === state.currentEnd) return 'boundary'
  if (index === farthest) return 'farthest'
  if (index < state.currentIndex) return 'scanned'
  if (index <= state.currentEnd) return 'in current range'
  if (index <= farthest) return 'newly reachable'
  return 'not reachable yet'
}

function getCellClass(status: string): string {
  if (status.startsWith('current')) {
    return 'border-primary bg-primary text-primary-foreground shadow-sm'
  }
  if (status === 'boundary') {
    return 'border-secondary bg-secondary text-secondary-foreground'
  }
  if (status === 'farthest') {
    return 'border-primary/70 bg-primary/15 text-foreground'
  }
  if (status === 'scanned') return 'border-primary/30 bg-primary/5 text-foreground'
  if (status === 'in current range') {
    return 'border-primary/25 bg-primary/5 text-foreground'
  }
  if (status === 'newly reachable') {
    return 'border-dashed border-primary/50 bg-primary/5 text-foreground'
  }
  return 'border-border bg-muted/30 text-muted-foreground'
}

export function JumpGameVisualizer({ name, state }: JumpGameVisualizerProps) {
  const lastIndex = state.data.length - 1
  const farthest = Math.min(state.farthest, lastIndex)

  return (
    <Card className="w-full border-0 shadow-none">
      <div className="flex flex-col gap-5 p-4">
        <p className="text-xs text-muted-foreground">
          Scan one jump range at a time. When the scan reaches its boundary,
          commit one jump and extend the next boundary to the farthest position
          found.
        </p>

        <div className="flex flex-wrap gap-2">
          <Metric
            label="Current index"
            variableName={state.variableNames.indexName}
            value={state.currentIndex}
          />
          <Metric
            label="Jumps committed"
            variableName={state.variableNames.jumpsName}
            value={state.jumps}
            emphasized
          />
          <Metric
            label="Current range ends"
            variableName={state.variableNames.currentEndName}
            value={state.currentEnd}
          />
          <Metric
            label="Farthest reachable"
            variableName={state.variableNames.farthestName}
            value={state.farthest}
            emphasized
          />
        </div>

        <div className="min-w-0 overflow-x-auto pb-2">
          <ol
            aria-label={`${name} jump game progress`}
            className="flex min-w-max gap-2 pt-6"
          >
            {state.data.map((value, index) => {
              const status = getCellStatus({ index, state })

              return (
                <li
                  key={index}
                  aria-current={
                    status.startsWith('current') ? 'step' : undefined
                  }
                  aria-label={`Index ${index}: jump length ${value}, ${status}`}
                  className="relative flex flex-col items-center gap-1"
                >
                  {index === state.currentIndex && (
                    <span className="absolute -top-6 font-mono text-xs font-semibold text-primary">
                      scan
                    </span>
                  )}
                  <div
                    className={[
                      'flex h-14 w-14 items-center justify-center rounded-md border-2 font-mono text-base transition-colors',
                      getCellClass(status),
                    ].join(' ')}
                  >
                    {value}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {index}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          {name}[{state.currentIndex}] = {state.data[state.currentIndex]} →
          reachable through {farthest}; current boundary = {state.currentEnd}
        </div>
      </div>
    </Card>
  )
}
