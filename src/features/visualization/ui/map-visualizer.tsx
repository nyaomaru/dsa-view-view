import { Card } from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import { isUndefined } from '@/shared/lib/guards'
import type { MapVisualizationState } from '../lib/map-view'

type MapVisualizerProps = {
  /** Semantic Map state derived from the current execution step. */
  state: MapVisualizationState
}

function LookupContext({
  state,
}: {
  /** Two Sum lookup state. */
  state: Extract<MapVisualizationState, { mode: 'lookup' }>
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2 font-mono text-xs">
        <span className="rounded-sm border bg-background px-2 py-1">
          target={state.target}
        </span>
        <span className="rounded-sm border bg-primary/[0.08] px-2 py-1">
          nums[{state.currentIndex}]={state.data[state.currentIndex]}
        </span>
        <span className="rounded-sm border border-primary/40 bg-primary/[0.14] px-2 py-1 font-bold">
          complement={state.complement}
        </span>
      </div>

      <div className="flex min-w-max justify-center gap-2 overflow-x-auto pb-1">
        {state.data.map((value, index) => (
          <div
            key={index}
            className={cn(
              'min-w-12 rounded-sm border px-3 py-2 text-center font-mono',
              index === state.currentIndex
                ? 'border-primary bg-primary/[0.14] font-bold ring-2 ring-primary/20'
                : 'bg-background'
            )}
          >
            <div className="text-xs text-muted-foreground">{index}</div>
            <div className="text-lg">{value}</div>
          </div>
        ))}
      </div>

      {!isUndefined(state.matchedIndex) && (
        <div className="rounded-md border border-primary/40 bg-primary/[0.10] px-3 py-2 text-center font-mono font-bold">
          match → result [{state.matchedIndex}, {state.currentIndex}]
        </div>
      )}
    </div>
  )
}

function FrequencyContext({
  state,
}: {
  /** Anagram frequency state. */
  state: Extract<MapVisualizationState, { mode: 'frequency' }>
}) {
  return (
    <div className="space-y-3 text-center">
      <div className="flex flex-wrap justify-center gap-2 font-mono text-xs">
        <span className="rounded-sm border bg-background px-2 py-1">
          s=&quot;{state.source}&quot;
        </span>
        <span className="rounded-sm border bg-background px-2 py-1">
          t=&quot;{state.comparison}&quot;
        </span>
        {!isUndefined(state.currentChar) && (
          <span className="rounded-sm border border-primary/40 bg-primary/[0.14] px-2 py-1 font-bold">
            char=&quot;{state.currentChar}&quot;
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Positive counts remain to be matched; zero means balanced.
      </p>
    </div>
  )
}

export function MapVisualizer({ state }: MapVisualizerProps) {
  return (
    <Card className="mx-auto w-full max-w-xl border-0 shadow-none">
      <div className="space-y-5 p-4">
        <div className="space-y-1 text-center">
          <h3 className="font-mono text-lg font-semibold text-muted-foreground">
            {state.mapName}:{' '}
            {state.mode === 'lookup' ? 'lookup table' : 'frequency table'}
          </h3>
        </div>

        {state.mode === 'lookup' ? (
          <LookupContext state={state} />
        ) : (
          <FrequencyContext state={state} />
        )}

        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-[1fr_1fr_6rem] border-b bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="border-r px-3 py-2">key</div>
            <div className="border-r px-3 py-2">value</div>
            <div className="px-3 py-2">status</div>
          </div>
          {state.entries.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Map is empty
            </div>
          ) : (
            state.entries.map((entry) => {
              const isActive =
                (state.mode === 'lookup' && entry.key === state.complement) ||
                (state.mode === 'frequency' && entry.key === state.currentChar)
              const isBalanced = state.mode === 'frequency' && entry.value === 0

              return (
                <div
                  key={String(entry.key)}
                  className={cn(
                    'grid grid-cols-[1fr_1fr_6rem] border-b font-mono text-sm last:border-b-0',
                    isActive ? 'bg-primary/[0.14] font-bold' : 'bg-background'
                  )}
                >
                  <div className="border-r px-3 py-2">{entry.key}</div>
                  <div className="border-r px-3 py-2">{entry.value}</div>
                  <div className="px-3 py-2 text-muted-foreground">
                    {isActive ? 'active' : isBalanced ? 'balanced' : 'stored'}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Card>
  )
}
