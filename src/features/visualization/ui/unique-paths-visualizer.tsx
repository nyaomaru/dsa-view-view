import { cn } from '@/shared/lib/class-names'
import type { UniquePathsState } from '../lib/unique-paths-view'

/** Shows the DP recurrence using the two cells that feed the latest write. */
export function UniquePathsVisualizer({ state }: { state: UniquePathsState }) {
  const { data, active, complete } = state
  const rows = data.length
  const cols = data[0].length
  const interior = active && active.row > 0 && active.col > 0

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">
          Unique Paths · {rows} × {cols}
        </h3>
        <p className="text-sm text-muted-foreground">
          Move right → or down ↓ from Start to Finish. Each cell counts the
          paths to reach it.
        </p>
        <p className="font-mono text-sm" aria-live="polite">
          {complete
            ? `Total unique paths: ${data[rows - 1][cols - 1]}`
            : interior
              ? `dp[${active.row}][${active.col}] = ${data[active.row - 1][active.col]} + ${data[active.row][active.col - 1]} = ${data[active.row][active.col]}`
              : active
                ? 'First row and first column: only one path reaches each cell.'
                : 'Initialize the table with zeros.'}
        </p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-2"
          role="group"
          aria-label="Unique paths DP table"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(5rem, 1fr))` }}
        >
          {data.flatMap((row, r) =>
            row.map((value, c) => {
              const selected = active?.row === r && active.col === c
              const above = interior && r === active.row - 1 && c === active.col
              const left = interior && r === active.row && c === active.col - 1
              const finish = r === rows - 1 && c === cols - 1
              const label = selected
                ? 'Current'
                : above
                  ? 'Above ↓'
                  : left
                    ? 'Left →'
                    : ''
              return (
                <div
                  key={`${r}-${c}`}
                  aria-label={`dp[${r}][${c}] = ${value}${label ? `, ${label}` : ''}`}
                  className={cn(
                    'flex min-h-24 flex-col items-center justify-center rounded-md border p-2 text-center',
                    selected
                      ? 'border-primary bg-primary/15 ring-2 ring-primary/30'
                      : above || left
                        ? 'border-sky-500 bg-sky-500/15'
                        : value > 0
                          ? 'border-border bg-muted/40'
                          : 'border-border text-muted-foreground',
                    complete &&
                      finish &&
                      'border-primary ring-2 ring-primary/30'
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    [{r}, {c}]
                  </span>
                  <strong className="font-mono text-2xl">{value}</strong>
                  <span className="min-h-4 text-xs">
                    {label ||
                      (r === 0 && c === 0 ? 'Start' : finish ? 'Finish' : '')}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Purple: current cell · Blue: counts from above and left · dp[row][col] =
        above + left
      </p>
    </div>
  )
}
