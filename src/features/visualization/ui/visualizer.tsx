import { useEffect, useRef, useState } from 'react'
import { Stack } from '@/shared/ui'
import { type ExecutionState } from '@/entities/execution'
import { VisualizationModal } from './visualization-modal'
import { VISUALIZATION_CONSTANTS } from '../constants/constants'
import { CurrentStepCard } from './current-step-card'
import { VariablesCard } from './variables-card'
import { ExecutionTimelineCard } from './execution-timeline-card'
import { ExecutionErrorCard } from './execution-error-card'
import { ReturnValueCard } from './return-value-card'
import { useVisualizationDetection } from '../model/use-visualization-detection'
import { isUndefined } from '@/shared/lib/guards'

/**
 * Props for Visualizer component.
 */
type VisualizerProps = {
  /** Current execution state to render. */
  executionState: ExecutionState
  /** Whether playback is currently running. */
  isRunning: boolean
  /** Whether to open the primary visualization modal automatically. */
  autoOpenPrimaryVisualization?: boolean
  /** Callback to pause playback. */
  onPause: () => void
  /** Callback to run playback through all remaining steps. */
  onRunAll: () => void
  /** Callback to reset execution to the first step. */
  onReset: () => void
  /** Callback to advance one execution step. */
  onStepForward: () => void
  /** Callback to move back one execution step. */
  onStepBackward: () => void
  /** Callback to jump to the final execution step. */
  onSkipToEnd: () => void
  /** Callback to jump to a specific zero-based execution step index. */
  onJumpToStep: (stepIndex: number) => void
}

/**
 * Visualization modal type selected from the variables panel.
 */
type ModalType =
  | 'stack'
  | 'tree'
  | 'tree-graph'
  | 'list-graph'
  | 'boolean-array'
  | 'area'
  | 'binary-search'
  | 'sliding-window'
  | 'bar-chart'
  | 'graph'
  | 'matrix'
  | null

const { DEFAULT_SCROLL_DELAY_MS: SCROLL_DELAY_MS } = VISUALIZATION_CONSTANTS

export function Visualizer({
  executionState,
  isRunning,
  autoOpenPrimaryVisualization = false,
  onPause,
  onRunAll,
  onReset,
  onStepForward,
  onStepBackward,
  onSkipToEnd,
  onJumpToStep,
}: VisualizerProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const currentStepRef = useRef<HTMLDivElement>(null)
  const returnValueRef = useRef<HTMLDivElement>(null)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoOpenedStepsRef = useRef<ExecutionState['steps'] | null>(null)
  const {
    currentStep,
    variableEntries,
    hasRecursion,
    isClassDesignTrace,
    primaryStackName,
    primaryArrayName,
    primaryAreaArrayName,
    primaryAreaStepIndex,
    primaryBinarySearchArrayName,
    primaryBinarySearchStepIndex,
    primarySlidingWindowStringName,
    primarySlidingWindowStepIndex,
    primaryBooleanArrayName,
    primaryGraphName,
    primaryMatrixName,
    primaryMatrixStepIndex,
    primaryTreeNodeName,
    visualizableTreeNodeNames,
    primaryListNodeName,
    visualizableListNodeNames,
  } = useVisualizationDetection(executionState)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [isFollowingPrimaryList, setIsFollowingPrimaryList] = useState(false)
  const [targetVariable, setTargetVariable] = useState<string | undefined>(
    undefined
  )
  const [targetStepIndex, setTargetStepIndex] = useState<number | undefined>(
    undefined
  )
  const [isCurrentStepExpanded, setIsCurrentStepExpanded] = useState(false)
  const [expandedVariables, setExpandedVariables] = useState<
    Record<string, boolean>
  >({})
  const [isReturnValueExpanded, setIsReturnValueExpanded] = useState(false)

  const openModal = (
    type: Exclude<ModalType, null>,
    variableName?: string,
    stepIndex?: number,
    followPrimaryList = false
  ) => {
    setIsFollowingPrimaryList(type === 'list-graph' && followPrimaryList)
    setTargetVariable(variableName)
    setTargetStepIndex(stepIndex)
    setModalType(type)
    setIsModalOpen(true)
  }

  const toggleVariableDetails = (variableName: string) => {
    setExpandedVariables((prev) => ({
      ...prev,
      [variableName]: !prev[variableName],
    }))
  }

  const handleStartClick = () => {
    if (executionState.isComplete) {
      onReset()
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null
        onRunAll()
      }, 0)
    } else {
      onRunAll()
    }
  }

  useEffect(() => {
    if (autoOpenedStepsRef.current !== executionState.steps) {
      autoOpenedStepsRef.current = null
    }
  }, [executionState.steps])

  useEffect(
    () => () => {
      if (restartTimerRef.current !== null) {
        clearTimeout(restartTimerRef.current)
      }
    },
    []
  )

  useEffect(() => {
    if (currentStepRef.current && timelineRef.current) {
      currentStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [executionState.currentStep])

  useEffect(() => {
    if (executionState.isComplete && returnValueRef.current) {
      const scrollTimer = setTimeout(() => {
        returnValueRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      }, SCROLL_DELAY_MS)

      return () => clearTimeout(scrollTimer)
    }
  }, [executionState.isComplete])

  useEffect(() => {
    if (!autoOpenPrimaryVisualization) return
    if (autoOpenedStepsRef.current === executionState.steps) return
    if (isModalOpen) return

    if (primaryAreaArrayName) {
      openModal('area', primaryAreaArrayName, primaryAreaStepIndex)
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryBinarySearchArrayName) {
      openModal(
        'binary-search',
        primaryBinarySearchArrayName,
        primaryBinarySearchStepIndex
      )
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primarySlidingWindowStringName) {
      openModal(
        'sliding-window',
        primarySlidingWindowStringName,
        primarySlidingWindowStepIndex
      )
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryStackName) {
      openModal('stack', primaryStackName)
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryArrayName) {
      openModal('bar-chart', primaryArrayName)
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryBooleanArrayName) {
      openModal('boolean-array', primaryBooleanArrayName)
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryGraphName) {
      openModal('graph', primaryGraphName)
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryMatrixName) {
      openModal('matrix', primaryMatrixName, primaryMatrixStepIndex)
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryTreeNodeName) {
      openModal('tree-graph', primaryTreeNodeName)
      autoOpenedStepsRef.current = executionState.steps
      return
    }

    if (primaryListNodeName) {
      openModal('list-graph', primaryListNodeName, undefined, true)
      autoOpenedStepsRef.current = executionState.steps
    }
  }, [
    autoOpenPrimaryVisualization,
    executionState.steps,
    isModalOpen,
    primaryStackName,
    primaryArrayName,
    primaryAreaArrayName,
    primaryAreaStepIndex,
    primaryBinarySearchArrayName,
    primaryBinarySearchStepIndex,
    primarySlidingWindowStringName,
    primarySlidingWindowStepIndex,
    primaryBooleanArrayName,
    primaryGraphName,
    primaryListNodeName,
    primaryMatrixName,
    primaryMatrixStepIndex,
    primaryTreeNodeName,
  ])

  useEffect(() => {
    if (
      isModalOpen &&
      modalType === 'list-graph' &&
      isFollowingPrimaryList &&
      primaryListNodeName
    ) {
      setTargetVariable(primaryListNodeName)
    }
  }, [isFollowingPrimaryList, isModalOpen, modalType, primaryListNodeName])

  return (
    <Stack spacing="md">
      <CurrentStepCard
        currentStep={currentStep}
        executionState={executionState}
        isExpanded={isCurrentStepExpanded}
        onExpandedChange={setIsCurrentStepExpanded}
        onJumpToStep={onJumpToStep}
      />
      {executionState.error && (
        <ExecutionErrorCard error={executionState.error} />
      )}
      <VariablesCard
        currentStep={currentStep}
        variableEntries={variableEntries}
        expandedVariables={expandedVariables}
        hasRecursion={hasRecursion}
        isClassDesignTrace={isClassDesignTrace}
        primaryArrayName={primaryArrayName}
        primaryAreaArrayName={primaryAreaArrayName}
        primaryAreaStepIndex={primaryAreaStepIndex}
        primaryBinarySearchArrayName={primaryBinarySearchArrayName}
        primaryBinarySearchStepIndex={primaryBinarySearchStepIndex}
        primarySlidingWindowStringName={primarySlidingWindowStringName}
        primarySlidingWindowStepIndex={primarySlidingWindowStepIndex}
        primaryBooleanArrayName={primaryBooleanArrayName}
        primaryGraphName={primaryGraphName}
        primaryMatrixName={primaryMatrixName}
        primaryMatrixStepIndex={primaryMatrixStepIndex}
        primaryTreeNodeName={primaryTreeNodeName}
        visualizableTreeNodeNames={visualizableTreeNodeNames}
        primaryListNodeName={primaryListNodeName}
        visualizableListNodeNames={visualizableListNodeNames}
        onToggleVariable={toggleVariableDetails}
        onOpenStack={(variableName) => openModal('stack', variableName)}
        onOpenBarChart={(variableName) => openModal('bar-chart', variableName)}
        onOpenArea={(variableName, stepIndex) =>
          openModal('area', variableName, stepIndex)
        }
        onOpenBinarySearch={(variableName, stepIndex) =>
          openModal('binary-search', variableName, stepIndex)
        }
        onOpenSlidingWindow={(variableName, stepIndex) =>
          openModal('sliding-window', variableName, stepIndex)
        }
        onOpenBooleanArray={(variableName) =>
          openModal('boolean-array', variableName)
        }
        onOpenGraph={(variableName) => openModal('graph', variableName)}
        onOpenMatrix={(variableName, stepIndex) =>
          openModal('matrix', variableName, stepIndex)
        }
        onOpenTreeGraph={(variableName) =>
          openModal('tree-graph', variableName)
        }
        onOpenListGraph={(variableName, followPrimary) =>
          openModal('list-graph', variableName, undefined, followPrimary)
        }
        onOpenTree={() => openModal('tree')}
      />
      <ExecutionTimelineCard
        executionState={executionState}
        isRunning={isRunning}
        timelineRef={timelineRef}
        currentStepRef={currentStepRef}
        onPause={onPause}
        onStart={handleStartClick}
        onReset={onReset}
        onStepForward={onStepForward}
        onStepBackward={onStepBackward}
        onSkipToEnd={onSkipToEnd}
      />
      {executionState.isComplete &&
        !isUndefined(executionState.returnValue) && (
          <ReturnValueCard
            returnValue={executionState.returnValue}
            isExpanded={isReturnValueExpanded}
            returnValueRef={returnValueRef}
            onExpandedChange={setIsReturnValueExpanded}
          />
        )}
      <VisualizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        targetVariable={targetVariable}
        targetStepIndex={targetStepIndex}
        executionState={executionState}
        isClassDesignTrace={isClassDesignTrace}
        isRunning={isRunning}
        onPause={onPause}
        onRunAll={handleStartClick}
        onReset={onReset}
        onStepForward={onStepForward}
        onStepBackward={onStepBackward}
        onSkipToEnd={onSkipToEnd}
      />
    </Stack>
  )
}
