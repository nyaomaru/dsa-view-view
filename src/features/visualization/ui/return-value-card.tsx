import { ChevronDown, ChevronUp } from 'lucide-react'
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
}

export function ReturnValueCard({
  returnValue,
  isExpanded,
  returnValueRef,
  onExpandedChange,
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
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
