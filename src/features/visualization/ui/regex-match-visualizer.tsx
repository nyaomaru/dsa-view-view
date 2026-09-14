import { cn } from '@/shared/lib/class-names'

import type { RegexMatchState } from '../lib/regex-match-view'

type RegexMatchVisualizerProps = {
  state: RegexMatchState
}

const MAX_GRID_AXIS_CELLS = 20

function getVisibleIndexes(length: number, currentIndex: number): number[] {
  const cellCount = length + 1
  const displayedCellCount = Math.min(cellCount, MAX_GRID_AXIS_CELLS)
  const start = Math.min(
    Math.max(0, currentIndex - Math.floor(displayedCellCount / 2)),
    cellCount - displayedCellCount
  )

  return Array.from({ length: displayedCellCount }, (_, index) => start + index)
}

/** Displays recursive regex matching calls as coordinates in its memoization table. */
export function RegexMatchVisualizer({ state }: RegexMatchVisualizerProps) {
  const source = Array.from(state.source)
  const pattern = Array.from(state.pattern)
  const sourceIndexes = getVisibleIndexes(source.length, state.current.i)
  const patternIndexes = getVisibleIndexes(pattern.length, state.current.j)
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
      {(sourceIndexes.length !== source.length + 1 ||
        patternIndexes.length !== pattern.length + 1) && (
        <p className="text-sm text-muted-foreground">
          Showing states near the current call to keep the grid responsive.
        </p>
      )}
      <div className="overflow-auto pr-8">
        <div
          className="grid w-max min-w-full gap-1 text-center text-xs"
          style={{
            gridTemplateColumns: `repeat(${patternIndexes.length + 1}, minmax(2.25rem, 1fr))`,
          }}
        >
          <span className={labelClass}>s\\p</span>
          {patternIndexes.map((index) => (
            <span key={index} className={labelClass}>
              {index}:{pattern[index] ?? '∅'}
            </span>
          ))}
          {sourceIndexes.map((i) => (
            <div className="contents" key={i}>
              <span className={labelClass}>
                {i}:{source[i] ?? '∅'}
              </span>
              {patternIndexes.map((j) => {
                const isCurrent = state.current.i === i && state.current.j === j
                const isVisited = state.visited.has(`${i},${j}`)

                return (
                  <span
                    className={cn(
                      'flex aspect-square items-center justify-center border border-border p-2 font-mono',
                      isVisited && 'bg-secondary',
                      isCurrent && 'bg-primary text-primary-foreground'
                    )}
                    data-regex-match-cell
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
