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
import type { VisualizationType } from '../model/types'
import { getPrimaryVisualization } from '../model/primary-visualization'

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
type ModalType = VisualizationType

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
  const suppressedTimelineScrollStepRef = useRef<number | undefined>(undefined)
  const detection = useVisualizationDetection(executionState)
  const {
    currentStep,
    variableEntries,
    hasRecursion,
    isClassDesignTrace,
    primaryHeapStepIndex,
    primaryWordLadderStepIndex,
    primaryArrayName,
    primaryAreaArrayName,
    primaryAreaStepIndex,
    primaryBinarySearchArrayName,
    primaryBinarySearchStepIndex,
    primarySlidingWindowStringName,
    primarySlidingWindowStepIndex,
    primaryDpName,
    primaryMapName,
    primaryMapStepIndex,
    primaryGraphName,
    primaryMatrixName,
    primaryMatrixStepIndex,
    primaryTreeNodeName,
    visualizableTreeNodeNames,
    primaryListNodeName,
    visualizableListNodeNames,
  } = detection

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

  const jumpToVariableChange = (stepIndex: number) => {
    suppressedTimelineScrollStepRef.current = stepIndex
    onJumpToStep(stepIndex)
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
    const shouldSuppressTimelineScroll =
      suppressedTimelineScrollStepRef.current === executionState.currentStep
    if (shouldSuppressTimelineScroll) return
    suppressedTimelineScrollStepRef.current = undefined

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

    const primaryVisualization = getPrimaryVisualization(detection)
    if (!primaryVisualization) return

    openModal(
      primaryVisualization.type,
      primaryVisualization.targetVariable,
      primaryVisualization.targetStepIndex,
      primaryVisualization.followPrimaryList
    )
    autoOpenedStepsRef.current = executionState.steps
  }, [
    autoOpenPrimaryVisualization,
    detection,
    executionState.steps,
    isModalOpen,
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
        executionState={executionState}
        currentStep={currentStep}
        variableEntries={variableEntries}
        expandedVariables={expandedVariables}
        hasRecursion={hasRecursion}
        isClassDesignTrace={isClassDesignTrace}
        primaryHeapStepIndex={primaryHeapStepIndex}
        primaryWordLadderStepIndex={primaryWordLadderStepIndex}
        primaryArrayName={primaryArrayName}
        primaryAreaArrayName={primaryAreaArrayName}
        primaryAreaStepIndex={primaryAreaStepIndex}
        primaryBinarySearchArrayName={primaryBinarySearchArrayName}
        primaryBinarySearchStepIndex={primaryBinarySearchStepIndex}
        primarySlidingWindowStringName={primarySlidingWindowStringName}
        primarySlidingWindowStepIndex={primarySlidingWindowStepIndex}
        primaryDpName={primaryDpName}
        primaryMapName={primaryMapName}
        primaryMapStepIndex={primaryMapStepIndex}
        primaryGraphName={primaryGraphName}
        primaryMatrixName={primaryMatrixName}
        primaryMatrixStepIndex={primaryMatrixStepIndex}
        primaryTreeNodeName={primaryTreeNodeName}
        visualizableTreeNodeNames={visualizableTreeNodeNames}
        primaryListNodeName={primaryListNodeName}
        visualizableListNodeNames={visualizableListNodeNames}
        onToggleVariable={toggleVariableDetails}
        onOpenVisualization={openModal}
        onJumpToStep={jumpToVariableChange}
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
            onStepBackward={
              executionState.totalSteps > 1 ? onStepBackward : undefined
            }
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
