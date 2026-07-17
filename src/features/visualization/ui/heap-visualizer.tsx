import type { HeapSnapshot } from '@/entities/execution'
import { Card } from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import type { HeapVisualizationState } from '../lib/heap-view'

type HeapVisualizerProps = {
  /** Current normalized dual-heap state. */
  state: HeapVisualizationState
}

function HeapTree({
  heap,
  highlightedValue,
}: {
  heap: HeapSnapshot
  highlightedValue?: number
}) {
  const levels: number[][] = []

  for (let start = 0, width = 1; start < heap.values.length; width *= 2) {
    levels.push(heap.values.slice(start, start + width))
    start += width
  }

  return (
    <section
      className="min-w-0 flex-1 rounded-md border bg-muted/20 p-4"
      aria-label={`${heap.kind === 'max' ? 'Max' : 'Min'} Heap ${heap.name}`}
    >
      <div className="mb-4 text-center">
        <h3 className="font-semibold">
          {heap.kind === 'max' ? 'Max Heap' : 'Min Heap'}
        </h3>
        <p className="font-mono text-xs text-muted-foreground">{heap.name}</p>
      </div>

      {levels.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Empty</p>
      ) : (
        <div className="space-y-3 overflow-x-auto py-2">
          {levels.map((level, levelIndex) => (
            <div
              key={levelIndex}
              className="flex min-w-max justify-center gap-3 px-2"
            >
              {level.map((value, index) => (
                <div
                  key={`${levelIndex}-${index}`}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background font-mono text-sm font-semibold transition-colors',
                    value === highlightedValue
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border'
                  )}
                >
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
        [{heap.values.join(', ')}]
      </p>
    </section>
  )
}

export function HeapVisualizer({ state }: HeapVisualizerProps) {
  const heaps = [...state.snapshot.heaps].sort((left, right) =>
    left.kind === right.kind ? 0 : left.kind === 'max' ? -1 : 1
  )

  return (
    <Card className="h-full w-full border-0 p-4 shadow-none">
      <div className="mb-4 flex min-h-10 items-center justify-between gap-4 rounded-md bg-secondary px-4 py-2 text-sm">
        <span>{state.action?.description ?? 'Heap state initialized'}</span>
        <span className="shrink-0 font-mono font-semibold">
          Median: {state.median ?? '—'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {heaps.map((heap) => (
          <HeapTree
            key={heap.name}
            heap={heap}
            highlightedValue={
              state.action?.targetHeapName === heap.name
                ? state.action.value
                : undefined
            }
          />
        ))}
      </div>
    </Card>
  )
}
