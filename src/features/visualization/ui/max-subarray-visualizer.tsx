import { Card } from '@/shared/ui'
import type { MaxSubarrayVisualizationState } from '../lib/max-subarray-view'

type MaxSubarrayVisualizerProps = {
  /** Source-array variable name. */
  name: string
  /** Current Kadane state and inferred runtime variable names. */
  state: MaxSubarrayVisualizationState
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

export function MaxSubarrayVisualizer({
  name,
  state,
}: MaxSubarrayVisualizerProps) {
  const { currentIndex, currentValue, variableNames } = state

  return (
    <Card className="w-full border-0 shadow-none">
      <div className="flex flex-col gap-5 p-4">
        <p className="text-xs text-muted-foreground">
          Each step tracks the best sum ending here and the best sum seen so
          far.
        </p>

        <div className="flex flex-wrap gap-2">
          <Metric
            label="Current index"
            variableName={variableNames.indexName}
            value={currentIndex}
          />
          <Metric
            label="Current value"
            variableName={`${name}[${variableNames.indexName}]`}
            value={currentValue}
          />
          <Metric
            label="Best ending here"
            variableName={variableNames.endingName}
            value={state.maxEndingHere}
            emphasized
          />
          <Metric
            label="Best so far"
            variableName={variableNames.bestName}
            value={state.maxSoFar}
            emphasized
          />
        </div>

        <div className="min-w-0 overflow-x-auto pb-2">
          <ol
            aria-label={`${name} maximum subarray progress`}
            className="flex min-w-max gap-2 pt-6"
          >
            {state.data.map((value, index) => {
              const isCurrent = index === currentIndex
              const isProcessed = index < currentIndex

              return (
                <li
                  key={index}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Index ${index}: ${value}${isCurrent ? ', current' : isProcessed ? ', processed' : ', pending'}`}
                  className="relative flex flex-col items-center gap-1"
                >
                  {isCurrent && (
                    <span className="absolute -top-6 font-mono text-xs font-semibold text-primary">
                      current
                    </span>
                  )}
                  <div
                    className={[
                      'flex h-14 w-14 items-center justify-center rounded-md border-2 font-mono text-base transition-colors',
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : isProcessed
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-border bg-muted/30 text-muted-foreground',
                    ].join(' ')}
                  >
                    {value}
                  </div>
                  <span
                    className={[
                      'font-mono text-xs',
                      isCurrent
                        ? 'font-bold text-primary'
                        : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {index}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          {variableNames.endingName} = max({currentValue}, previous +{' '}
          {currentValue}) · {variableNames.bestName} = max(previous,{' '}
          {variableNames.endingName})
        </div>
      </div>
    </Card>
  )
}
