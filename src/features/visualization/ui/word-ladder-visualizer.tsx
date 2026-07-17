import { cn } from '@/shared/lib/class-names'
import { Card } from '@/shared/ui'
import type {
  WordLadderNode,
  WordLadderVisualizationState,
} from '../lib/word-ladder-view'

type WordLadderVisualizerProps = {
  state: WordLadderVisualizationState
}

const NODE_STATE_CLASS_NAMES: Record<WordLadderNode['state'], string> = {
  unvisited: 'border-border bg-background text-foreground',
  visited: 'border-primary/40 bg-primary/10 text-foreground',
  queued: 'border-primary bg-primary/20 text-foreground',
  current: 'border-primary bg-primary text-primary-foreground',
}

function WordNode({ node }: { node: WordLadderNode }) {
  return (
    <div
      className={cn(
        'relative rounded-md border-2 px-3 py-2 text-center font-mono text-sm font-semibold transition-colors',
        NODE_STATE_CLASS_NAMES[node.state]
      )}
      aria-label={`${node.word}: ${node.state}${node.isTarget ? ', target' : ''}`}
    >
      {node.word}
    </div>
  )
}

export function WordLadderVisualizer({ state }: WordLadderVisualizerProps) {
  const reachableLevels = [
    ...new Set(
      state.nodes.flatMap((node) => (node.level === null ? [] : [node.level]))
    ),
  ].sort((left, right) => left - right)
  const unreachableNodes = state.nodes.filter((node) => node.level === null)

  return (
    <Card className="w-full border-0 p-4 shadow-none">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Current word</p>
          <p className="mt-1 font-mono font-semibold">
            {state.currentWord ?? '—'}
          </p>
        </div>
        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="mt-1 font-mono font-semibold">
            {state.currentDistance ?? '—'}
          </p>
        </div>
        <div className="rounded-md bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Pattern</p>
          <p className="mt-1 font-mono font-semibold">
            {state.activePattern ?? '—'}
          </p>
        </div>
      </div>

      {!state.isTargetAvailable && (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          Target “{state.endWord}” is not in wordList, so the algorithm returns
          0.
        </div>
      )}

      <section className="mt-5" aria-label="BFS queue">
        <h3 className="text-sm font-semibold">Queue</h3>
        <div className="mt-2 flex min-h-10 flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
          {state.queue.length > 0 ? (
            state.queue.map(({ word, distance }, index) => (
              <div
                key={`${word}-${distance}-${index}`}
                className="rounded border bg-background px-2 py-1 font-mono text-xs"
              >
                {word} ({distance})
              </div>
            ))
          ) : (
            <span className="self-center text-xs text-muted-foreground">
              Empty
            </span>
          )}
        </div>
      </section>

      <section className="mt-5" aria-label="Word transformation levels">
        <h3 className="text-sm font-semibold">Transformation graph</h3>

        <div className="mt-3 space-y-3 overflow-x-auto rounded-md border bg-muted/20 p-3">
          {reachableLevels.map((level) => (
            <div
              key={level}
              className="grid min-w-[24rem] grid-cols-[5rem_1fr] items-center gap-3"
            >
              <span className="font-mono text-xs text-muted-foreground">
                Level {level + 1}
              </span>
              <div className="flex flex-wrap gap-2">
                {state.nodes
                  .filter((node) => node.level === level)
                  .map((node) => (
                    <WordNode key={node.word} node={node} />
                  ))}
              </div>
            </div>
          ))}

          {unreachableNodes.length > 0 && (
            <div className="grid min-w-[24rem] grid-cols-[5rem_1fr] items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                Unreachable
              </span>
              <div className="flex flex-wrap gap-2">
                {unreachableNodes.map((node) => (
                  <WordNode key={node.word} node={node} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5" aria-label="Word transformations">
        <h3 className="text-sm font-semibold">One-letter transitions</h3>
        <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
          {state.edges.map((edge) => (
            <span
              key={`${edge.from}-${edge.to}`}
              className={cn(
                'rounded border px-2 py-1 font-mono text-xs',
                edge.isActive && 'border-primary bg-primary/10'
              )}
            >
              {edge.from} ↔ {edge.to}
            </span>
          ))}
        </div>
      </section>
    </Card>
  )
}
