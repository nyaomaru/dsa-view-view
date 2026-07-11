import { Card } from '@/shared/ui'
import type { SlidingWindowState } from '../lib/sliding-window-view'

type SlidingWindowVisualizerProps = {
  /** String data being scanned by the sliding window. */
  data: string
  /** Variable name represented by the string data. */
  name: string
  /** Current left/right window pointer state. */
  windowState: SlidingWindowState
}

function getMarkerLabel(
  index: number,
  windowState: SlidingWindowState
): string {
  if (index === windowState.left && index === windowState.right) return 'L/R'
  if (index === windowState.left) return 'L'
  if (index === windowState.right) return 'R'

  return ''
}

export function SlidingWindowVisualizer({
  data,
  windowState,
}: SlidingWindowVisualizerProps) {
  const chars = Array.from(data)

  return (
    <Card className="h-full border-0 shadow-none">
      <div className="flex h-full min-h-[18rem] flex-col justify-center gap-6 p-4">
        <div className="space-y-2 text-center">
          <div className="flex flex-wrap justify-center gap-2 font-mono text-sm">
            <span className="border border-primary px-2 py-1">
              left: {windowState.left}
            </span>
            <span className="border border-primary px-2 py-1">
              right: {windowState.right}
            </span>
            {windowState.windowSize !== undefined && (
              <span className="border border-primary px-2 py-1">
                size: {windowState.windowSize}
              </span>
            )}
            {windowState.pattern !== undefined && (
              <span className="border border-primary px-2 py-1">
                pattern: {windowState.pattern}
              </span>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-2">
          <div
            className="mx-auto grid min-w-max gap-2 px-2"
            style={{
              gridTemplateColumns: `repeat(${chars.length}, minmax(3rem, 1fr))`,
            }}
          >
            {chars.map((char, index) => {
              const isInWindow =
                index >= windowState.left && index <= windowState.right
              const isBoundary =
                index === windowState.left || index === windowState.right

              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={[
                      'flex h-14 w-full min-w-12 items-center justify-center border font-mono text-base font-bold transition-colors',
                      isBoundary
                        ? 'border-primary bg-primary text-background'
                        : isInWindow
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-muted-foreground/40 bg-background text-muted-foreground/60',
                    ].join(' ')}
                  >
                    {char}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {index}
                  </div>
                  <div className="h-5 font-mono text-[0.6875rem] font-bold text-primary">
                    {getMarkerLabel(index, windowState)}
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
