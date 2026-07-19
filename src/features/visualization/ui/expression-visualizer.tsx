import { cn } from '@/shared/lib/class-names'
import { Badge, Card } from '@/shared/ui'
import type { ExpressionVisualizationState } from '../lib/expression-view'

type ExpressionVisualizerProps = {
  state: ExpressionVisualizationState
}

function formatSign(value: number): string {
  return value > 0 ? '+1' : '-1'
}

export function ExpressionVisualizer({ state }: ExpressionVisualizerProps) {
  const characters = state.expression.split('')
  const pendingTotal = state.result + state.sign * state.currentNumber

  return (
    <Card className="w-full border-0 p-4 shadow-none">
      <section aria-label="Expression cursor">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Expression</h3>
          <Badge variant="secondary">{state.action}</Badge>
        </div>

        <div className="mt-3 overflow-x-auto rounded-md bg-muted/20 p-3">
          <div className="flex min-w-max justify-center font-mono text-base">
            {characters.map((character, index) => {
              const isCurrent = index === state.index

              return (
                <div
                  key={index}
                  className="flex w-9 flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded border transition-colors',
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground'
                    )}
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-label={
                      isCurrent
                        ? `Current character ${character || 'space'} at index ${index}`
                        : undefined
                    }
                  >
                    {character === ' ' ? '·' : character}
                  </span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    {index}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Result</p>
          <p className="mt-1 font-mono text-lg font-semibold">{state.result}</p>
        </div>
        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Current number</p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {state.currentNumber}
          </p>
        </div>
        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Sign</p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {formatSign(state.sign)}
          </p>
        </div>
        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Pending total</p>
          <p className="mt-1 font-mono text-lg font-semibold">{pendingTotal}</p>
        </div>
      </div>

      <section className="mt-5" aria-label="Parenthesis sign stack">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">Parenthesis sign stack</h3>
          <span className="text-xs text-muted-foreground">
            Cumulative signs from the root scope to the current scope
          </span>
        </div>

        <div className="mt-2 flex min-h-24 flex-col items-center justify-end gap-2 rounded-md bg-muted/20 p-3">
          {[...state.signStack].reverse().map((value, reverseIndex) => (
            <div
              key={`${state.signStack.length - reverseIndex}-${value}`}
              className={cn(
                'flex w-full max-w-xs items-center justify-between rounded-md border px-3 py-2 font-mono',
                reverseIndex === 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground'
              )}
              aria-label={`${formatSign(value)} sign context${
                reverseIndex === 0 ? ', top' : ''
              }${reverseIndex === state.signStack.length - 1 ? ', root' : ''}`}
            >
              <span>{formatSign(value)}</span>
              <span className="text-[0.625rem] font-semibold uppercase tracking-wide">
                {reverseIndex === 0 &&
                reverseIndex === state.signStack.length - 1
                  ? 'Top · Root'
                  : reverseIndex === 0
                    ? 'Top'
                    : reverseIndex === state.signStack.length - 1
                      ? 'Root'
                      : ''}
              </span>
            </div>
          ))}
        </div>
      </section>
    </Card>
  )
}
