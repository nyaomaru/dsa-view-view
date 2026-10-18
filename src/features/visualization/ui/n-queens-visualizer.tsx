import { cn } from '@/shared/lib/class-names'
import { Card } from '@/shared/ui'
import type { NQueensVisualizationState } from '../lib/n-queens-view'

type NQueensVisualizerProps = {
  state: NQueensVisualizationState
}

/** Renders the placements explored by an N-Queens backtracking execution. */
export function NQueensVisualizer({ state }: NQueensVisualizerProps) {
  return (
    <Card
      className="h-full border-0 shadow-none"
      data-testid="n-queens-visualizer"
    >
      <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-5 p-4">
        <div className="flex flex-wrap justify-center gap-2 font-mono text-sm">
          <span className="border border-primary px-2 py-1">
            board: {state.size} × {state.size}
          </span>
          <span className="border border-primary px-2 py-1">
            queens placed: {state.placedQueens}
          </span>
          {state.currentRow !== null && (
            <span className="border border-primary px-2 py-1">
              exploring row: {state.currentRow}
            </span>
          )}
          {state.solutionCount !== null && (
            <span className="border border-primary px-2 py-1">
              solutions: {state.solutionCount}
            </span>
          )}
        </div>

        <div className="w-full overflow-auto pb-2">
          <div
            aria-label={`${state.size} by ${state.size} chessboard`}
            className="mx-auto grid w-max overflow-hidden rounded border-2 border-foreground/40 shadow-sm"
            style={{
              gridTemplateColumns: `repeat(${state.size}, minmax(2.5rem, 1fr))`,
            }}
          >
            {state.board.flatMap((boardRow, row) =>
              boardRow.map((hasQueen, column) => {
                const isCurrent =
                  state.currentRow === row && state.currentColumn === column
                return (
                  <div
                    aria-label={
                      hasQueen
                        ? `Queen at row ${row}, column ${column}`
                        : undefined
                    }
                    className={cn(
                      'flex h-10 w-10 items-center justify-center text-2xl sm:h-12 sm:w-12',
                      (row + column) % 2 === 0
                        ? 'bg-amber-100 text-slate-900 dark:bg-amber-100'
                        : 'bg-amber-700 text-white dark:bg-amber-700',
                      isCurrent &&
                        'ring-2 ring-inset ring-primary ring-offset-1'
                    )}
                    data-n-queens-cell
                    key={`${row}-${column}`}
                  >
                    {hasQueen ? '♛' : ''}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Each queen is a placement currently retained by the backtracking
          search.
        </p>
      </div>
    </Card>
  )
}
