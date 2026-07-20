import { useEffect, useMemo, useState } from 'react'
import type { ExecutionState } from '@/entities/execution'
import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import {
  getCallFrameDetails,
  getCallFrameInspectorState,
  getCallerFrameContext,
  type CallFrameStatus,
  type InspectedCallFrame,
} from '../lib/call-frame-inspector'
import { stringifyValuePreview } from '../lib/value-formatting'

type CallFrameInspectorProps = {
  /** Execution trace at the currently selected timeline step. */
  executionState: ExecutionState
}

const STATUS_LABELS: Record<CallFrameStatus, string> = {
  current: 'Current',
  suspended: 'Suspended',
  returning: 'Returning',
  completed: 'Completed',
}

function FrameButton({
  frame,
  isSelected,
  onSelect,
}: {
  frame: InspectedCallFrame
  isSelected: boolean
  onSelect: () => void
}) {
  const isExecuting = frame.status === 'current' || frame.status === 'returning'

  return (
    <button
      type="button"
      aria-label={`${frame.functionName} #${frame.id}, ${STATUS_LABELS[frame.status]}`}
      aria-current={isExecuting ? 'true' : undefined}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'w-full cursor-pointer rounded-md border px-3 py-2 text-left transition-colors',
        'hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-mono text-sm font-medium">
          {frame.functionName}
          <span className="ml-1 text-muted-foreground">#{frame.id}</span>
        </span>
        {frame.status !== 'completed' && (
          <Badge
            variant={isExecuting ? 'default' : 'outline'}
            className="shrink-0"
          >
            {STATUS_LABELS[frame.status]}
          </Badge>
        )}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">
        Depth {frame.depth} · last observed at step{' '}
        {frame.lastObservedStepIndex + 1}
      </span>
    </button>
  )
}

function ValueRows({
  values,
  emptyMessage,
}: {
  values: Record<string, unknown>
  emptyMessage: string
}) {
  const entries = Object.entries(values)

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <dl className="divide-y rounded-md border bg-muted/20">
      {entries.map(([name, value]) => (
        <div
          key={name}
          className="grid grid-cols-[minmax(5rem,0.35fr)_minmax(0,1fr)] gap-3 px-3 py-2 text-sm"
        >
          <dt className="truncate font-mono font-medium">{name}</dt>
          <dd
            className="break-all text-right font-mono text-muted-foreground"
            title={stringifyValuePreview(value)}
          >
            {stringifyValuePreview(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function CallFrameInspector({
  executionState,
}: CallFrameInspectorProps) {
  const inspectorState = useMemo(
    () => getCallFrameInspectorState(executionState),
    [executionState]
  )
  const [selectedFrameId, setSelectedFrameId] = useState<number>()
  const selectedFrameStillExists =
    selectedFrameId !== undefined &&
    inspectorState.frames.some((frame) => frame.id === selectedFrameId)
  const fallbackFrameId =
    inspectorState.currentFrameId ??
    inspectorState.frames[inspectorState.frames.length - 1]?.id
  const effectiveSelectedFrameId = selectedFrameStillExists
    ? selectedFrameId
    : fallbackFrameId
  const selectedFrame = inspectorState.frames.find(
    (frame) => frame.id === effectiveSelectedFrameId
  )
  const selectedFrameDetails = useMemo(
    () =>
      selectedFrame
        ? getCallFrameDetails(executionState, selectedFrame)
        : undefined,
    [executionState, selectedFrame]
  )
  const callerContext = useMemo(
    () =>
      selectedFrame
        ? getCallerFrameContext(executionState, selectedFrame)
        : undefined,
    [executionState, selectedFrame]
  )

  useEffect(() => {
    if (selectedFrameId !== undefined && !selectedFrameStillExists) {
      setSelectedFrameId(undefined)
    }
  }, [selectedFrameId, selectedFrameStillExists])

  if (!selectedFrame || !selectedFrameDetails) {
    return (
      <section
        aria-label="Call frame guidance"
        className="w-full rounded-md border border-primary/25 bg-primary/5 p-3"
      >
        <p className="text-sm font-medium">No active calls at this step.</p>
        <p className="text-xs text-muted-foreground">
          Step backward to inspect an earlier call frame.
        </p>
      </section>
    )
  }

  const activeFrameIds = new Set(inspectorState.activeFrameIds)
  const activeFrames = inspectorState.frames
    .filter(
      (frame) => activeFrameIds.has(frame.id) || frame.status === 'returning'
    )
    .reverse()
  const completedFrames = inspectorState.frames
    .filter((frame) => frame.status === 'completed')
    .reverse()

  return (
    <div className="grid w-full gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(13rem,0.4fr)_minmax(0,1fr)]">
      <aside
        className="space-y-4 lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:space-y-0 lg:overflow-hidden"
        aria-label="Call frames"
      >
        <section className="space-y-2 lg:shrink-0">
          <header>
            <h3 className="text-sm font-semibold">Active stack</h3>
            <p className="text-xs text-muted-foreground">
              Current call first, followed by its callers.
            </p>
          </header>
          {activeFrames.length > 0 ? (
            <div className="space-y-2">
              {activeFrames.map((frame) => (
                <FrameButton
                  key={frame.id}
                  frame={frame}
                  isSelected={frame.id === effectiveSelectedFrameId}
                  onSelect={() => setSelectedFrameId(frame.id)}
                />
              ))}
            </div>
          ) : (
            <p
              aria-label="No active calls"
              className="rounded-md border border-primary/25 bg-primary/5 p-3"
            >
              <span className="block text-sm font-medium">
                No active calls at this step.
              </span>
              <span className="block text-xs text-muted-foreground">
                Step backward to inspect an earlier call frame.
              </span>
            </p>
          )}
        </section>

        {completedFrames.length > 0 && (
          <section className="space-y-2 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-2 lg:space-y-0">
            <h3 className="text-sm font-semibold">Completed calls</h3>
            <div className="space-y-2 overflow-y-auto pr-1 lg:min-h-0 lg:flex-1">
              {completedFrames.map((frame) => (
                <FrameButton
                  key={frame.id}
                  frame={frame}
                  isSelected={frame.id === effectiveSelectedFrameId}
                  onSelect={() => setSelectedFrameId(frame.id)}
                />
              ))}
            </div>
          </section>
        )}
      </aside>

      <section
        className="min-w-0 space-y-4 rounded-md border bg-card p-4 lg:min-h-0 lg:overflow-y-auto"
        aria-label={`${selectedFrame.functionName} #${selectedFrame.id} frame details`}
      >
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-mono text-base font-semibold">
              {selectedFrame.functionName} #{selectedFrame.id}
            </h3>
            <p className="text-xs text-muted-foreground">
              Depth {selectedFrame.depth} · started at step{' '}
              {selectedFrame.startStepIndex + 1}
            </p>
          </div>
          {selectedFrame.status !== 'completed' && (
            <Badge
              variant={
                selectedFrame.status === 'current' ||
                selectedFrame.status === 'returning'
                  ? 'default'
                  : 'outline'
              }
            >
              {STATUS_LABELS[selectedFrame.status]}
            </Badge>
          )}
        </header>

        {selectedFrame.status === 'suspended' && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Showing the last state observed before this frame was suspended.
          </p>
        )}

        {callerContext && (
          <section
            className="space-y-2 rounded-md border p-3"
            aria-label="Caller context"
          >
            <header>
              <h4 className="text-sm font-semibold">Caller context</h4>
              <p className="text-xs text-muted-foreground">
                State from{' '}
                <code className="font-mono">
                  {callerContext.frame.functionName} #{callerContext.frame.id}
                </code>{' '}
                immediately before this call.
              </p>
            </header>
            <ValueRows
              values={{
                ...callerContext.details.parameters,
                ...callerContext.details.locals,
              }}
              emptyMessage="No caller variables were observed."
            />
          </section>
        )}

        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Parameters</h4>
          <ValueRows
            values={selectedFrameDetails.parameters}
            emptyMessage="No parameters were captured."
          />
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Local variables</h4>
          <ValueRows
            values={selectedFrameDetails.locals}
            emptyMessage="No local variables have been observed yet."
          />
        </section>

        {selectedFrame.hasReturnValue && (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold">Return value</h4>
            <code className="block break-all rounded-md border bg-muted/20 px-3 py-2 text-sm text-primary">
              {stringifyValuePreview(selectedFrameDetails.returnValue)}
            </code>
          </section>
        )}
      </section>
    </div>
  )
}
