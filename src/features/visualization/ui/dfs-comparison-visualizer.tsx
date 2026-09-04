import type { ReactNode } from 'react'
import type { ExecutionState } from '@/entities/execution'
import { isArray, isMatrix, isNumber } from '@/shared/lib/guards'
import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import {
  getCallFrameDetails,
  getCallFrameInspectorState,
} from '../lib/call-frame-inspector'
import type { DfsComparisonExecution } from '../lib/dfs-comparison'
import { stringifyValuePreview } from '../lib/value-formatting'

type MatrixValue = readonly (readonly unknown[])[]

function getLatestVariable(
  executionState: ExecutionState,
  variableName: string,
  stepIndex = executionState.currentStep
): unknown {
  for (let index = stepIndex; index >= 0; index -= 1) {
    const variables = executionState.steps[index]?.variables
    if (variables && Object.hasOwn(variables, variableName)) {
      return variables[variableName]
    }
  }

  return undefined
}

function getInitialGrid(
  executionState: ExecutionState
): MatrixValue | undefined {
  for (const step of executionState.steps) {
    const grid = step.variables.grid
    if (isMatrix(grid)) return grid
  }

  return undefined
}

function CompactGrid({
  executionState,
  label,
}: {
  executionState: ExecutionState
  label: string
}) {
  const grid = getLatestVariable(executionState, 'grid')
  const previousGrid = getLatestVariable(
    executionState,
    'grid',
    executionState.currentStep - 1
  )
  const initialGrid = getInitialGrid(executionState)

  if (!isMatrix(grid)) {
    return (
      <p className="text-sm text-muted-foreground">
        Grid is not available yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Visited grid</h4>
        <div className="flex flex-wrap gap-2 text-[0.6875rem] text-muted-foreground">
          <span>1 = unvisited land</span>
          <span>0 = water</span>
          <span className="font-semibold text-primary">0 = visited land</span>
        </div>
      </div>
      <div className="overflow-x-auto pb-1">
        <div
          role="grid"
          aria-label={label}
          className="grid w-max gap-1"
          style={{
            gridTemplateColumns: `repeat(${grid[0]?.length ?? 0}, minmax(2.5rem, 1fr))`,
          }}
        >
          {grid.flatMap((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const wasLand = initialGrid?.[rowIndex]?.[colIndex] === '1'
              const isVisited = wasLand && cell === '0'
              const hasChanged =
                isMatrix(previousGrid) &&
                previousGrid[rowIndex]?.[colIndex] !== cell

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  role="gridcell"
                  aria-label={`row ${rowIndex}, column ${colIndex}: ${String(cell)}${isVisited ? ', visited land' : ''}`}
                  className={cn(
                    'flex h-10 min-w-10 items-center justify-center rounded-sm border font-mono text-sm font-semibold',
                    cell === '1' && 'border-primary/50 bg-primary/15',
                    !wasLand &&
                      'border-border bg-muted/20 text-muted-foreground',
                    isVisited &&
                      'border-primary bg-primary text-primary-foreground',
                    hasChanged &&
                      'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}
                >
                  {String(cell)}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function ExecutionSummary({
  executionState,
}: {
  executionState: ExecutionState
}) {
  const islands = getLatestVariable(executionState, 'islands')
  const currentStep = executionState.steps[executionState.currentStep]

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">
          Step {executionState.currentStep + 1} / {executionState.totalSteps}
        </span>
        <Badge variant="outline">
          Islands: {isNumber(islands) ? islands : '—'}
        </Badge>
      </div>
      <p className="mt-2 min-h-8 break-words font-mono text-xs text-muted-foreground">
        {currentStep?.description ?? 'Waiting for the first step.'}
      </p>
    </div>
  )
}

function RecursivePendingWork({
  executionState,
}: {
  executionState: ExecutionState
}) {
  const inspector = getCallFrameInspectorState(executionState)
  const activeFrameIds = new Set(inspector.activeFrameIds)
  const visitFrames = inspector.frames
    .filter(
      (frame) =>
        frame.functionName === 'visit' &&
        (activeFrameIds.has(frame.id) || frame.id === inspector.currentFrameId)
    )
    .reverse()

  return (
    <section aria-label="Recursive DFS pending work" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Call frames (implicit stack)</h4>
        <Badge variant="secondary">{visitFrames.length} pending</Badge>
      </div>
      <div className="min-h-32 space-y-2 rounded-md border bg-muted/10 p-3">
        {visitFrames.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending visit calls at this step.
          </p>
        ) : (
          visitFrames.map((frame, index) => {
            const { parameters } = getCallFrameDetails(executionState, frame)

            return (
              <div
                key={frame.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-sm border bg-card px-3 py-2',
                  index === 0 && 'border-primary bg-primary/10'
                )}
              >
                <span className="font-mono text-sm">
                  visit({stringifyValuePreview(parameters.row)},{' '}
                  {stringifyValuePreview(parameters.col)})
                </span>
                <Badge variant={index === 0 ? 'default' : 'outline'}>
                  {index === 0 ? 'Current' : `Depth ${frame.depth}`}
                </Badge>
              </div>
            )
          })
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        The current call is on top; callers wait underneath it.
      </p>
    </section>
  )
}

function IterativePendingWork({
  executionState,
}: {
  executionState: ExecutionState
}) {
  const stack = getLatestVariable(executionState, 'stack')
  const pendingCells = isArray(stack) ? [...stack].reverse() : []

  return (
    <section aria-label="Iterative DFS pending work" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Explicit stack</h4>
        <Badge variant="secondary">{pendingCells.length} pending</Badge>
      </div>
      <div className="min-h-32 space-y-2 rounded-md border bg-muted/10 p-3">
        {pendingCells.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending cells at this step.
          </p>
        ) : (
          pendingCells.map((cell, index) => (
            <div
              key={`${pendingCells.length - index}-${stringifyValuePreview(cell)}`}
              className={cn(
                'flex items-center justify-between gap-3 rounded-sm border bg-card px-3 py-2',
                index === 0 && 'border-primary bg-primary/10'
              )}
            >
              <span className="font-mono text-sm">
                {stringifyValuePreview(cell)}
              </span>
              <Badge variant={index === 0 ? 'default' : 'outline'}>
                {index === 0 ? 'Top' : `S${pendingCells.length - index - 1}`}
              </Badge>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        The next cell to pop is on top; later work waits underneath it.
      </p>
    </section>
  )
}

function ComparisonPanel({
  title,
  subtitle,
  executionState,
  children,
}: {
  title: string
  subtitle: string
  executionState: ExecutionState
  children: ReactNode
}) {
  return (
    <section className="min-w-0 space-y-4 rounded-md border bg-card p-4">
      <header>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </header>
      <ExecutionSummary executionState={executionState} />
      <CompactGrid
        executionState={executionState}
        label={`${title} visited grid`}
      />
      {children}
    </section>
  )
}

/** Compares actual recursive and iterative Number of Islands traces. */
export function DfsComparisonVisualizer({
  comparison,
}: {
  comparison: DfsComparisonExecution
}) {
  const resultsMatch =
    comparison.recursive.isComplete &&
    comparison.iterative.isComplete &&
    comparison.recursive.returnValue === comparison.iterative.returnValue

  return (
    <div className="w-full min-w-0 space-y-4" aria-label="DFS comparison">
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <ComparisonPanel
          title="Recursive DFS"
          subtitle="Pending work lives in JavaScript call frames."
          executionState={comparison.recursive}
        >
          <RecursivePendingWork executionState={comparison.recursive} />
        </ComparisonPanel>
        <ComparisonPanel
          title="Iterative DFS"
          subtitle="Pending work lives in an array used as a stack."
          executionState={comparison.iterative}
        >
          <IterativePendingWork executionState={comparison.iterative} />
        </ComparisonPanel>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-xs">
        <span>
          Traces are aligned by visited-grid state; setup and stack operations
          are not one-to-one.
        </span>
        {resultsMatch && (
          <Badge variant="default">
            Same result:{' '}
            {stringifyValuePreview(comparison.recursive.returnValue)}
          </Badge>
        )}
      </div>
    </div>
  )
}
