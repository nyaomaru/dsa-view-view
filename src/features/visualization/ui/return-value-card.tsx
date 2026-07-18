import { ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { isInlineReturnValue, stringifyValue } from '../lib/value-formatting'
import type { RefObject } from 'react'

/**
 * Props for ReturnValueCard component.
 */
type ReturnValueCardProps = {
  /** Final return value from execution. */
  returnValue: unknown
  /** Whether structured return details are expanded. */
  isExpanded: boolean
  /** Ref used to scroll the return value card into view. */
  returnValueRef: RefObject<HTMLDivElement | null>
  /** Callback when the detail expansion state changes. */
  onExpandedChange: (isExpanded: boolean) => void
  /** Moves playback to the previous step when step review is available. */
  onStepBackward?: () => void
}

export function ReturnValueCard({
  returnValue,
  isExpanded,
  returnValueRef,
  onExpandedChange,
  onStepBackward,
}: ReturnValueCardProps) {
  const shouldInlineReturnValue = isInlineReturnValue(returnValue)

  return (
    <Card ref={returnValueRef} className="border-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-primary">Return Value</CardTitle>
        {!shouldInlineReturnValue && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => onExpandedChange(!isExpanded)}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          {shouldInlineReturnValue ? (
            <code className="font-mono text-sm">
              {stringifyValue(returnValue)}
            </code>
          ) : isExpanded ? (
            <code className="font-mono text-sm">
              {stringifyValue(returnValue)}
            </code>
          ) : (
            <p className="text-sm text-muted-foreground">
              Return value hidden. Open details to inspect it.
            </p>
          )}
        </div>
        {onStepBackward && (
          <div className="flex flex-col gap-3 rounded-md border border-primary/25 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Want to see how this result was reached?
              </p>
              <p className="text-xs text-muted-foreground">
                Use Step Backward to review the execution one step at a time.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1"
              onClick={onStepBackward}
            >
              <ChevronLeft className="h-4 w-4" />
              Step Backward
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
