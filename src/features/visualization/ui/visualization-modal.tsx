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
}: {
  /** Type of visualization title to render. */
  type: VisualizationType
  /** Target variable name shown in the title when applicable. */
  targetVariable?: string
  /** Display name for return-value tree graphs. */
  treeGraphDisplayName?: string
  /** Whether tree visualization represents class-design operation calls. */
  isClassDesignTrace: boolean
}): ReactNode {
  switch (type) {
    case 'expression':
      return 'Expression View'
    case 'stack':
      return `Stack Visualization: ${targetVariable}`
    case 'tree':
      return isClassDesignTrace ? 'Call Stack View' : 'Recursion Tree'
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
  isClassDesignTrace: boolean
): string {
  switch (type) {
    case 'expression':
      return 'Follow the current character, accumulated result, and nested sign context.'
    case 'stack':
      return 'Visualize array as a vertical stack.'
    case 'tree':
      return isClassDesignTrace
        ? 'Visualize class operation calls as a tree.'
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
  const title = getVisualizationTitle({
    type,
    targetVariable,
    treeGraphDisplayName,
    isClassDesignTrace,
  })
  const description = getVisualizationDescription(type, isClassDesignTrace)
  const currentStep = executionState.steps[executionState.currentStep]
  const content = (
    <VisualizationModalContent
      type={type}
      targetVariable={targetVariable}
      targetStepIndex={targetStepIndex}
      executionState={executionState}
      currentStep={currentStep}
      treeGraphDisplayName={treeGraphDisplayName}
    />
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="top-4 h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] translate-y-0 flex flex-col bg-background sm:top-[50%] sm:h-[min(80vh,calc(100dvh-2rem))] sm:max-w-3xl sm:translate-y-[-50%]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'py-4 flex-1 min-h-0 overflow-y-auto overscroll-contain',
            (type === 'matrix' ||
              type === 'expression' ||
              type === 'list-graph' ||
              type === 'dp' ||
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
            <div className="shrink-0">
              <ReturnValueCard
                returnValue={executionState.returnValue}
                isExpanded={isReturnValueExpanded}
                returnValueRef={returnValueRef}
                onExpandedChange={setIsReturnValueExpanded}
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
          className="shrink-0 justify-center gap-2 pt-4 border-t mt-auto"
        />
      </DialogContent>
    </Dialog>
  )
}
