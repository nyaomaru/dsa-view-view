import { Card } from '@/shared/ui'
import type { FirstMissingPositiveVisualizationState } from '../lib/first-missing-positive-view'

type FirstMissingPositiveVisualizerProps = {
  name: string
  state: FirstMissingPositiveVisualizationState
}

export function FirstMissingPositiveVisualizer({
  name,
  state,
}: FirstMissingPositiveVisualizerProps) {
  return (
    <Card className="h-full border-0 shadow-none">
      <div className="flex h-full min-h-[18rem] flex-col justify-center gap-6 p-4">
        <div className="space-y-2 text-center">
          <h3 className="font-mono text-lg font-semibold text-muted-foreground">
            {name}: [{state.data.join(', ')}]
          </h3>
          <p className="text-sm text-muted-foreground">
            Place each value <code>v</code> at index <code>v - 1</code> when{' '}
            <code>1 ≤ v ≤ {state.n}</code>.
          </p>
          <div className="flex flex-wrap justify-center gap-2 font-mono text-sm">
            <span className="border border-primary px-2 py-1">i: {state.index}</span>
            <span className="border border-primary px-2 py-1">
              targetIndex: {state.targetIndex ?? '-'}
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-2">
          <div
            className="mx-auto grid min-w-max gap-2 px-2"
            style={{
              gridTemplateColumns: `repeat(${state.data.length}, minmax(4rem, 1fr))`,
            }}
          >
            {state.data.map((value, index) => {
              const isCurrent = index === state.index
              const isTarget = index === state.targetIndex
              const isPlaced = value === index + 1
              const isOutOfRange = value < 1 || value > state.n

              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    aria-label={`Index ${index}: value ${value}${isCurrent ? ', current' : ''}${isTarget ? ', target' : ''}${isPlaced ? ', correctly placed' : ''}`}
                    className={[
                      'flex h-14 w-full min-w-16 items-center justify-center border font-mono text-base font-bold transition-colors',
                      isCurrent
                        ? 'border-primary bg-primary text-background'
                        : isTarget
                          ? 'border-primary bg-primary/20 text-primary'
                          : isPlaced
                            ? 'border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : isOutOfRange
                              ? 'border-muted-foreground/40 bg-muted text-muted-foreground'
                              : 'border-muted-foreground/40 bg-background',
                    ].join(' ')}
                  >
                    {value}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {index}
                  </div>
                  <div className="flex h-5 items-center gap-1 font-mono text-[0.6875rem] font-bold text-primary">
                    {isCurrent && <span>i</span>}
                    {isTarget && <span>target</span>}
                    {isPlaced && <span>✓</span>}
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
