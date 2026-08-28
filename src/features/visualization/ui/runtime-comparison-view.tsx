import type { RuntimeComparison } from '@/entities/execution'
import { cn } from '@/shared/lib/class-names'
import { Badge, Card } from '@/shared/ui'
import { formatDisplayValue } from '../lib/display-value'

type RuntimeComparisonViewProps = {
  /** Evaluated comparison to explain at the current execution step. */
  comparison: RuntimeComparison
  /** Optional layout classes supplied by the containing visualizer. */
  className?: string
}

function formatOperand(value: unknown): string {
  return formatDisplayValue(value, {
    nullLabel: 'null',
    undefinedLabel: 'undefined',
  })
}

/** Displays both evaluated comparison operands and their runtime outcome. */
export function RuntimeComparisonView({
  comparison,
  className,
}: RuntimeComparisonViewProps) {
  const resultLabel = String(comparison.result)

  return (
    <Card
      className={cn('w-full max-w-lg p-4', className)}
      aria-label="Runtime comparison"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Runtime comparison</h3>
        <Badge variant={comparison.result ? 'secondary' : 'destructive'}>
          {resultLabel}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
        <div
          className="min-w-0 rounded-md bg-muted/30 p-3"
          aria-label="Left comparison operand"
        >
          <p className="truncate text-xs text-muted-foreground">
            Actual · <code>{comparison.left.expression}</code>
          </p>
          <code className="mt-1 block break-all text-base font-semibold">
            {formatOperand(comparison.left.value)}
          </code>
        </div>

        <code className="flex items-center px-1 text-sm font-semibold text-muted-foreground">
          {comparison.operator}
        </code>

        <div
          className="min-w-0 rounded-md bg-muted/30 p-3"
          aria-label="Right comparison operand"
        >
          <p className="truncate text-xs text-muted-foreground">
            Expected · <code>{comparison.right.expression}</code>
          </p>
          <code className="mt-1 block break-all text-base font-semibold">
            {formatOperand(comparison.right.value)}
          </code>
        </div>
      </div>
    </Card>
  )
}
