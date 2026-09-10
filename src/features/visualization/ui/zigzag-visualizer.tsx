import { Card } from '@/shared/ui'
import type { ZigzagVisualizationState } from '../lib/zigzag-view'

type ZigzagVisualizerProps = {
  state: ZigzagVisualizationState
}

type Cell = { char: string; sourceIndex: number } | null

function getGrid({ source, numRows }: ZigzagVisualizationState): Cell[][] {
  const grid = Array.from({ length: numRows }, () => [] as Cell[])
  let row = 0
  let direction = 1
  let column = 0

  Array.from(source).forEach((char, sourceIndex) => {
    while ((grid[0]?.length ?? 0) <= column) {
      grid.forEach((gridRow) => gridRow.push(null))
    }
    grid[row]![column] = { char, sourceIndex }

    if (row === numRows - 1 && direction === 1) {
      direction = -1
      column++
    } else if (row === 0 && direction === -1) {
      direction = 1
      column++
    }
    row += direction
  })

  return grid
}

export function ZigzagVisualizer({ state }: ZigzagVisualizerProps) {
  const grid = getGrid(state)
  const currentIndex = state.processedCharacterCount - 1
  const output = state.rows.join('')

  return (
    <Card className="h-full border-0 shadow-none">
      <div className="flex h-full min-h-[18rem] flex-col justify-center gap-6 p-4">
        <div className="flex flex-wrap justify-center gap-2 font-mono text-sm">
          <span className="border border-primary px-2 py-1">rows: {state.numRows}</span>
          <span className="border border-primary px-2 py-1">
            placed: {state.processedCharacterCount}/{Array.from(state.source).length}
          </span>
          <span className="border border-primary px-2 py-1">
            next row: {state.row}
          </span>
          <span className="border border-primary px-2 py-1">
            direction: {state.direction === 1 ? 'down' : 'up'}
          </span>
        </div>

        <div className="w-full overflow-x-auto pb-2">
          <div className="mx-auto grid w-max gap-2 font-mono" style={{ gridTemplateColumns: `auto repeat(${grid[0]?.length ?? 0}, minmax(2.5rem, 1fr))` }}>
            {grid.flatMap((gridRow, rowIndex) => [
              <div key={`label-${rowIndex}`} className="flex h-10 items-center pr-2 text-xs text-muted-foreground">
                row {rowIndex}
              </div>,
              ...gridRow.map((cell, columnIndex) => {
                const isPlaced = cell !== null && cell.sourceIndex < state.processedCharacterCount
                const isCurrent = cell?.sourceIndex === currentIndex
                return (
                  <div
                    key={`${rowIndex}-${columnIndex}`}
                    className={[
                      'flex h-10 w-10 items-center justify-center border text-base font-bold',
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isPlaced
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-muted-foreground/20 text-muted-foreground/30',
                    ].join(' ')}
                  >
                    {cell?.char ?? ''}
                  </div>
                )
              }),
            ])}
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm">
          <span className="text-muted-foreground">rows.join('')</span>
          <span className="mx-2 text-muted-foreground">→</span>
          <span className="font-semibold text-primary">{output}</span>
        </div>
      </div>
    </Card>
  )
}
