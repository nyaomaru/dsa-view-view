import { ArrowRight, ChevronLeft } from 'lucide-react'
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import type { VariableChange } from '../lib/variable-change-navigation'
import { stringifyValue } from '../lib/value-formatting'

type VariableChangeNavigatorProps = {
  /** Variable names available for change navigation. */
  variableNames: string[]
  /** Variable currently selected for navigation. */
  selectedVariableName?: string
  /** Nearest change before the current execution step. */
  previousChange?: VariableChange
  /** Change represented by the current execution step. */
  currentChange?: VariableChange
  /** Selects the variable to track. */
  onSelectedVariableChange: (variableName: string) => void
  /** Jumps to the nearest previous change. */
  onPreviousChange: () => void
}

export function VariableChangeNavigator({
  variableNames,
  selectedVariableName,
  previousChange,
  currentChange,
  onSelectedVariableChange,
  onPreviousChange,
}: VariableChangeNavigatorProps) {
  return (
    <div className="space-y-3 rounded-md border border-primary/25 bg-primary/5 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Variable changes</p>
          <p className="text-xs text-muted-foreground">
            Select a variable to revisit the last time its value changed.
          </p>
        </div>
        <Select
          value={selectedVariableName ?? ''}
          onValueChange={onSelectedVariableChange}
        >
          <SelectTrigger
            aria-label="Variable to track"
            className="w-full font-mono sm:w-40"
          >
            <SelectValue placeholder="Choose variable" />
          </SelectTrigger>
          <SelectContent>
            {variableNames.map((variableName) => (
              <SelectItem
                key={variableName}
                value={variableName}
                className="font-mono"
              >
                {variableName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedVariableName && (
        <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={onPreviousChange}
            disabled={!previousChange}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous change
          </Button>

          {currentChange && (
            <div
              aria-label={`${selectedVariableName} value change`}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-xs"
            >
              <div className="min-w-0">
                <span className="block text-muted-foreground">Previous</span>
                <code className="block break-all font-mono font-medium">
                  {stringifyValue(currentChange.previousValue)}
                </code>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <span className="block text-muted-foreground">Current</span>
                <code className="block break-all font-mono font-medium text-primary">
                  {stringifyValue(currentChange.currentValue)}
                </code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
