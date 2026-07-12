import { Card } from '@/shared/ui'
import type { BinarySearchIndexState } from '../lib/binary-search-view'

type BinarySearchVisualizerProps = {
  /** Numeric array being searched. */
  data: number[]
  /** Variable name displayed in the visualizer title. */
  name: string
  /** Current left/right/mid index state. */
  indexState: BinarySearchIndexState
}

function getClampedRange(indexState: BinarySearchIndexState, length: number) {
  const left = Math.max(0, Math.min(indexState.left, length - 1))
  const right = Math.max(0, Math.min(indexState.right, length - 1))

  return left <= right ? { left, right } : null
}

export function BinarySearchVisualizer({
  data,
  name,
  indexState,
}: BinarySearchVisualizerProps) {
  const activeRange = getClampedRange(indexState, data.length)

  return (
    <Card className="h-full border-0 shadow-none">
      <div className="flex h-full min-h-[18rem] flex-col justify-center gap-6 p-4">
        <div className="space-y-2 text-center">
          <h3 className="font-mono text-lg font-semibold text-muted-foreground">
            {name}: [{data.join(', ')}]
          </h3>
          <div className="flex flex-wrap justify-center gap-2 font-mono text-sm">
            <span className="border border-primary px-2 py-1">
              left: {indexState.left}
            </span>
            <span className="border border-primary px-2 py-1">
              right: {indexState.right}
            </span>
            <span className="border border-primary px-2 py-1">
              mid: {indexState.mid ?? '-'}
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-2">
          <div
            className="mx-auto grid min-w-max gap-2 px-2"
            style={{
              gridTemplateColumns: `repeat(${data.length}, minmax(3.5rem, 1fr))`,
            }}
          >
            {data.map((value, index) => {
              const isInRange =
                activeRange !== null &&
                index >= activeRange.left &&
                index <= activeRange.right
              const isMid = indexState.mid === index
              const isLeft = indexState.left === index
              const isRight = indexState.right === index

              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={[
                      'flex h-14 w-full min-w-14 items-center justify-center border font-mono text-base font-bold transition-colors',
                      isMid
                        ? 'border-primary bg-primary text-background'
                        : isInRange
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-muted-foreground/40 bg-background text-muted-foreground/50',
                    ].join(' ')}
                  >
                    {value}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {index}
                  </div>
                  <div className="flex h-5 items-center gap-1 font-mono text-[0.6875rem] font-bold text-primary">
                    {isLeft && <span>L</span>}
                    {isMid && <span>M</span>}
                    {isRight && <span>R</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
