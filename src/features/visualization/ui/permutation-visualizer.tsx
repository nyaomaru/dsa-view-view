import { Card } from '@/shared/ui'
import type { PermutationVisualizationState } from '../lib/permutation-view'

type PermutationVisualizerProps = {
  state: PermutationVisualizationState
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-32 rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}

export function PermutationVisualizer({ state }: PermutationVisualizerProps) {
  const selectedValue = state.numbers[state.index]
  const isAwaitingRemoval = selectedValue !== undefined
  const blockStart = state.index * state.blockSize
  const blockEnd = blockStart + state.blockSize - 1

  return (
    <Card className="w-full border-0 shadow-none">
      <div className="flex flex-col gap-5 p-4">
        <p className="text-sm text-muted-foreground">
          Each available number owns a block of <code>{state.blockSize}</code>{' '}
          permutations. Divide the zero-based rank to choose its block, then
          keep the remainder for the next position. The candidate pool below is
          shown just before this selection, so it remains visible after{' '}
          <code>splice</code> to explain the removal.
        </p>

        <div className="flex flex-wrap gap-2">
          <Metric label="Positions remaining" value={state.remain} />
          <Metric label="Block size" value={`${state.remain - 1}! = ${state.blockSize}`} />
          <Metric label="Zero-based rank" value={state.rank} />
          <Metric label="Chosen index" value={state.index} />
        </div>

        <div className="rounded-md border border-border bg-muted/20 p-3 font-mono text-sm">
          <span className="text-muted-foreground">result = </span>
          <strong>{state.result || '∅'}</strong>
          {isAwaitingRemoval && !state.selectionIsCommitted && (
            <>
              <span className="text-muted-foreground"> + </span>
              <strong className="text-primary">{selectedValue}</strong>
            </>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">
            Candidate pool before this selection
          </div>
          <ol
            aria-label="Available permutation candidates"
            className="flex min-w-max gap-2 overflow-x-auto pb-2"
          >
            {state.numbers.map((value, candidateIndex) => {
              const isSelected = candidateIndex === state.index
              const candidateBlockStart = candidateIndex * state.blockSize
              const candidateBlockEnd = candidateBlockStart + state.blockSize - 1

              return (
                <li key={value} className="flex flex-col items-center gap-1">
                  <div
                    aria-current={isSelected ? 'step' : undefined}
                    aria-label={`Candidate ${value}, index ${candidateIndex}${isSelected ? ', selected' : ''}`}
                    className={[
                      'flex h-14 w-14 items-center justify-center rounded-md border-2 font-mono text-lg font-bold',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-foreground',
                    ].join(' ')}
                  >
                    {value}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    [{candidateBlockStart}–{candidateBlockEnd}]
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="rounded-md bg-primary/10 px-3 py-2 font-mono text-xs text-foreground">
          index = ⌊{state.rank} / {state.blockSize}⌋ = {state.index}; selected
          block = [{blockStart}–{blockEnd}]
        </div>
      </div>
    </Card>
  )
}
