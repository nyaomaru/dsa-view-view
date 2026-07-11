import { Check } from 'lucide-react'
import { Card } from '@/shared/ui'

type BooleanArrayVisualizerProps = {
  /** Boolean array to render as an index-to-value table. */
  data: readonly boolean[]
  /** Variable name displayed in the visualizer title. */
  name: string
}

export function BooleanArrayVisualizer({
  data,
  name,
}: BooleanArrayVisualizerProps) {
  return (
    <Card className="w-full max-w-md border-0 shadow-none">
      <div className="space-y-4 p-4">
        <div className="space-y-1 text-center">
          <h3 className="font-mono text-lg font-semibold text-muted-foreground">
            {name}: boolean DP table
          </h3>
          <p className="text-sm text-muted-foreground">
            check = true. A check mark means this index is currently reachable.
          </p>
        </div>

        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-[5rem_1fr] border-b bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="border-r px-3 py-2">index</div>
            <div className="px-3 py-2">value</div>
          </div>
          {data.map((value, index) => (
            <div
              key={index}
              className="grid grid-cols-[5rem_1fr] border-b last:border-b-0"
            >
              <div className="border-r px-3 py-2 font-mono text-sm text-muted-foreground">
                {index}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 font-mono text-sm">
                {value ? (
                  <>
                    <Check className="h-4 w-4 text-primary" />
                    true
                  </>
                ) : (
                  <span className="text-muted-foreground">false</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
