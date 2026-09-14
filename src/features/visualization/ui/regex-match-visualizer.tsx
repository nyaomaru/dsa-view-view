import { cn } from '@/shared/lib/class-names'

import type { RegexMatchState } from '../lib/regex-match-view'

type RegexMatchVisualizerProps = {
  state: RegexMatchState
}

/** Displays recursive regex matching calls as coordinates in its memoization table. */
export function RegexMatchVisualizer({ state }: RegexMatchVisualizerProps) {
  const source = Array.from(state.source)
  const pattern = Array.from(state.pattern)
  const labelClass =
    'flex aspect-square items-center justify-center p-2 text-muted-foreground'

  return (
    <div className="space-y-4" data-testid="regex-match-visualizer">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <p>
          <span className="text-muted-foreground">String </span>
          <code className="text-primary">{JSON.stringify(state.source)}</code>
        </p>
        <p>
          <span className="text-muted-foreground">Pattern </span>
          <code className="text-primary">{JSON.stringify(state.pattern)}</code>
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Current call: <code>dp({state.current.i}, {state.current.j})</code>. Each
        marked cell is a memoization state reached so far.
      </p>
      <div className="overflow-auto">
        <div
          className="grid w-max min-w-full gap-1 text-center text-xs"
          style={{ gridTemplateColumns: `repeat(${pattern.length + 2}, minmax(2.25rem, 1fr))` }}
        >
          <span className={labelClass}>s\\p</span>
          {pattern.map((character, index) => (
            <span key={`${character}-${index}`} className={labelClass}>
              {index}:{character}
            </span>
          ))}
          <span className={labelClass}>{pattern.length}:∅</span>
          {Array.from({ length: source.length + 1 }, (_, i) => (
            <div className="contents" key={i}>
              <span className={labelClass}>
                {i}:{source[i] ?? '∅'}
              </span>
              {Array.from({ length: pattern.length + 1 }, (_, j) => {
                const isCurrent = state.current.i === i && state.current.j === j
                const isVisited = state.visited.has(`${i},${j}`)

                return (
                  <span
                    className={cn(
                      'flex aspect-square items-center justify-center border border-border p-2 font-mono',
                      isVisited && 'bg-secondary',
                      isCurrent && 'bg-primary text-primary-foreground'
                    )}
                    key={`${i},${j}`}
                  >
                    {isCurrent ? 'dp' : isVisited ? '•' : ''}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
