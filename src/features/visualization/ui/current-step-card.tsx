import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Group,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Stack,
} from '@/shared/ui'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { VALUE_PREVIEW_LIMIT } from '../lib/value-formatting'

/**
 * Props for CurrentStepCard component.
 */
type CurrentStepCardProps = {
  /** Currently selected execution step. */
  currentStep?: ExecutionStep
  /** Full execution state used for step selection. */
  executionState: ExecutionState
  /** Whether the current step detail block is expanded. */
  isExpanded: boolean
  /** Callback when the detail expansion state changes. */
  onExpandedChange: (isExpanded: boolean) => void
  /** Callback to jump to a specific zero-based execution step index. */
  onJumpToStep: (stepIndex: number) => void
}

export function CurrentStepCard({
  currentStep,
  executionState,
  isExpanded,
  onExpandedChange,
  onJumpToStep,
}: CurrentStepCardProps) {
  const needsToggle = Boolean(
    currentStep &&
    (currentStep.description.length > VALUE_PREVIEW_LIMIT ||
      (currentStep.callStack?.length ?? 0) > 0)
  )

  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex min-w-0 items-center gap-4">
            <span className="shrink-0">Current Step</span>
            <Select
              value={String(executionState.currentStep)}
              onValueChange={(value) => onJumpToStep(Number(value))}
            >
              <SelectTrigger className="h-7 w-[7rem] px-2 py-0 text-xs font-mono font-bold">
                <span>
                  {executionState.currentStep + 1} / {executionState.totalSteps}
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-64 min-w-[5rem]">
                {executionState.steps.map((step, index) => (
                  <SelectItem
                    key={`${step.stepNumber}-${index}`}
                    value={String(index)}
                    className="font-mono text-xs"
                  >
                    {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1"
            onClick={() => onExpandedChange(!isExpanded)}
            disabled={!needsToggle}
          >
            {needsToggle
              ? isExpanded
                ? 'Hide details'
                : 'Show details'
              : 'Inline'}
            {needsToggle &&
              (isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              ))}
          </Button>
        </div>
        {(!currentStep || !isExpanded || !needsToggle) && (
          <CardDescription>
            {currentStep ? currentStep.description : 'No step selected'}
          </CardDescription>
        )}
      </CardHeader>
      {currentStep && isExpanded && needsToggle && (
        <CardContent>
          <Stack spacing="xs">
            <p className="text-sm">{currentStep.description}</p>
            <Group spacing="xs" align="center">
              <Badge>{currentStep.type}</Badge>
              <span className="text-sm text-muted-foreground">
                Line {currentStep.line}
              </span>
            </Group>
            {currentStep.callStack && currentStep.callStack.length > 0 && (
              <code className="font-mono text-sm text-muted-foreground">
                {currentStep.callStack.join(' -> ')}
              </code>
            )}
          </Stack>
        </CardContent>
      )}
    </Card>
  )
}
