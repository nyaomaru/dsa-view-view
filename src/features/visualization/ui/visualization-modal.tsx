import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import { type ExecutionState } from '@/entities/execution'
import { RETURN_VALUE_LABEL } from '@/entities/execution'
import { isTreeNodeShape } from '@/entities/data-structure'
import { isUndefined } from '@/shared/lib/guards'
import { useRef, useState, type ReactNode } from 'react'
import { VisualizationModalContent } from './visualization-modal-content'

import { Grid3X3 } from 'lucide-react'
import { PlaybackControls } from './playback-controls'
import { ReturnValueCard } from './return-value-card'
import type { VisualizationType } from '../model/types'
import { hasCallFrameMetadata } from '../lib/call-frame-inspector'

/**
 * Props for VisualizationModal component
 */
type VisualizationModalProps = {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Type of visualization to display */
  type: VisualizationType
  /** Name of the variable to visualize (if applicable) */
  targetVariable?: string
  /** Step index to use when the target variable is not available on the current step. */
  targetStepIndex?: number
  /** Current execution state */
  executionState: ExecutionState
  /** Whether the tree modal represents class-design operation calls. */
  isClassDesignTrace?: boolean
  /** Whether execution is currently running */
  isRunning: boolean
  /** Callback to pause execution */
  onPause: () => void
  /** Callback to run all steps */
  onRunAll: () => void
  /** Callback to reset execution */
  onReset: () => void
  /** Callback to step forward */
  onStepForward: () => void
  /** Callback to step backward */
  onStepBackward: () => void
  /** Callback to skip to end */
  onSkipToEnd: () => void
}

function getVisualizationTitle({
  type,
  targetVariable,
  treeGraphDisplayName,
  isClassDesignTrace,
  hasCallFrames,
}: {
  /** Type of visualization title to render. */
  type: VisualizationType
  /** Target variable name shown in the title when applicable. */
  targetVariable?: string
  /** Display name for return-value tree graphs. */
  treeGraphDisplayName?: string
  /** Whether tree visualization represents class-design operation calls. */
  isClassDesignTrace: boolean
  /** Whether the trace supports per-invocation call-frame inspection. */
  hasCallFrames: boolean
}): ReactNode {
  switch (type) {
    case 'expression':
      return 'Expression View'
    case 'stack':
      return `Stack Visualization: ${targetVariable}`
    case 'tree':
      return isClassDesignTrace
        ? 'Call Stack View'
        : hasCallFrames
          ? 'Call Frame Inspector'
          : 'Recursion Tree'
    case 'tree-graph':
      return `Tree Graph: ${treeGraphDisplayName}`
    case 'list-graph':
      return `List Graph: ${targetVariable}`
    case 'dp':
      return `DP View: ${targetVariable}`
    case 'map':
      return `Map View: ${targetVariable}`
    case 'bar-chart':
      return `Bar Chart: ${targetVariable}`
    case 'area':
      return `Area View: ${targetVariable}`
    case 'max-subarray':
      return `Maximum Subarray View: ${targetVariable}`
    case 'binary-search':
      return `Index View: ${targetVariable}`
    case 'sliding-window':
      return `Sliding Window View: ${targetVariable}`
    case 'graph':
      return `Graph: ${targetVariable}`
    case 'matrix':
      return (
        <>
          <Grid3X3 className="w-5 h-5 mr-2 inline" />
          Matrix: {targetVariable}
        </>
      )
    case 'heap':
      return 'Heap View'
    case 'word-ladder':
      return 'Word Ladder View'
    case null:
      return ''
  }
}

function getVisualizationDescription(
  type: VisualizationType,
  isClassDesignTrace: boolean,
  hasCallFrames: boolean
): string {
  switch (type) {
    case 'expression':
      return 'Follow the current character, accumulated result, and nested sign context.'
    case 'stack':
      return 'Visualize array as a vertical stack.'
    case 'tree':
      return isClassDesignTrace
        ? 'Visualize class operation calls as a tree.'
        : hasCallFrames
          ? 'Inspect recursive call frames, parameters, local variables, and return values.'
          : 'Visualize recursion call stack as a tree.'
    case 'tree-graph':
      return 'Visualize binary tree node structure as a graph.'
    case 'list-graph':
      return 'Visualize linked list next pointers and cycle edges.'
    case 'dp':
      return 'Visualize dynamic-programming values or rolling state.'
    case 'map':
      return 'Visualize Map entries and the current algorithm context.'
    case 'bar-chart':
      return 'Visualize numeric array as a bar chart.'
    case 'area':
      return 'Visualize the current container, histogram rectangle, or trapped water.'
    case 'max-subarray':
      return 'Follow the current position, best sum ending here, and best sum seen so far.'
    case 'binary-search':
      return 'Visualize the current binary-search range and mid index.'
    case 'sliding-window':
      return 'Visualize the current sliding window over the string.'
    case 'graph':
      return 'Visualize adjacency list as a directed graph.'
    case 'matrix':
      return 'Visualize 2D array as a grid.'
    case 'heap':
      return 'Visualize values moving between the prepared max and min heaps.'
    case 'word-ladder':
      return 'Visualize the word-transformation graph and current BFS frontier.'
    case null:
      return ''
  }
}

export function VisualizationModal({
  isOpen,
  onClose,
  type,
  targetVariable,
  targetStepIndex,
  executionState,
  isClassDesignTrace = false,
  isRunning,
  onPause,
  onRunAll,
  onReset,
  onStepForward,
  onStepBackward,
  onSkipToEnd,
}: VisualizationModalProps) {
  const returnValueRef = useRef<HTMLDivElement>(null)
  const [isReturnValueExpanded, setIsReturnValueExpanded] = useState(false)
  const treeGraphDisplayName =
    type === 'tree-graph' &&
    targetVariable === RETURN_VALUE_LABEL &&
    isTreeNodeShape(executionState.returnValue)
      ? RETURN_VALUE_LABEL
      : targetVariable
  const hasCallFrames =
    !isClassDesignTrace && hasCallFrameMetadata(executionState)
  const showsCallFrameInspector = type === 'tree' && hasCallFrames
  const title = getVisualizationTitle({
    type,
    targetVariable,
    treeGraphDisplayName,
    isClassDesignTrace,
    hasCallFrames,
  })
  const description = getVisualizationDescription(
    type,
    isClassDesignTrace,
    hasCallFrames
  )
  const currentStep = executionState.steps[executionState.currentStep]
  const content = (
    <VisualizationModalContent
      type={type}
      targetVariable={targetVariable}
      targetStepIndex={targetStepIndex}
      executionState={executionState}
      currentStep={currentStep}
      treeGraphDisplayName={treeGraphDisplayName}
      isClassDesignTrace={isClassDesignTrace}
    />
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="left-1 top-2 flex h-[calc(100dvh-1rem)] w-[calc(100vw-0.5rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 bg-background p-1 sm:left-[50%] sm:top-[50%] sm:h-[min(80vh,calc(100dvh-2rem))] sm:w-[calc(100vw-2rem)] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:gap-4 sm:p-6">
        <DialogHeader className="shrink-0 px-4 pb-3 pt-4 pr-14 text-left sm:p-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="hidden sm:block">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain px-4 py-3 sm:px-0 sm:py-4',
            showsCallFrameInspector && 'lg:overflow-hidden',
            type === 'graph' &&
              'flex items-center justify-center overflow-hidden',
            (type === 'matrix' ||
              type === 'expression' ||
              type === 'list-graph' ||
              type === 'dp' ||
              type === 'max-subarray' ||
              type === 'map' ||
              type === 'heap' ||
              type === 'word-ladder') &&
              'flex items-start justify-center sm:items-center'
          )}
          data-tree-scroll-container
        >
          {content}
        </div>

        {executionState.isComplete &&
          !isUndefined(executionState.returnValue) && (
            <div className="shrink-0 px-4 pb-3 sm:px-0 sm:pb-0">
              <ReturnValueCard
                returnValue={executionState.returnValue}
                isExpanded={isReturnValueExpanded}
                returnValueRef={returnValueRef}
                onExpandedChange={setIsReturnValueExpanded}
                compactOnMobile
                onStepBackward={
                  executionState.totalSteps > 1 ? onStepBackward : undefined
                }
              />
            </div>
          )}

        <PlaybackControls
          executionState={executionState}
          isRunning={isRunning}
          onPause={onPause}
          onStart={onRunAll}
          onReset={onReset}
          onStepForward={onStepForward}
          onStepBackward={onStepBackward}
          onSkipToEnd={onSkipToEnd}
          className="mt-auto shrink-0 justify-center gap-2 px-4 py-3 sm:px-0 sm:pb-0 sm:pt-4"
        />
      </DialogContent>
    </Dialog>
  )
}
