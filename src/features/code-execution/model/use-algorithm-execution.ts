import { useState, useRef, useCallback, useEffect } from 'react'
import {
  stepForward,
  stepBackward,
  resetToStart,
  skipToEnd,
} from '../lib/execution-state'
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@/entities/code'
import type { ExecutionState } from '@/entities/execution'
import type { InputValues } from '@/entities/execution'
import { EXECUTION_CONSTANTS } from './constants'

const { EXECUTION_INTERVAL_MS } = EXECUTION_CONSTANTS

/**
 * Custom hook to manage algorithm execution logic
 * Handles stepping, automatic playback, and execution state
 */
export function useAlgorithmExecution() {
  const [executionState, setExecutionState] = useState<ExecutionState | null>(
    null
  )
  const [isRunning, setIsRunning] = useState(false)
  const [playbackInterval, setPlaybackInterval] = useState<number>(
    EXECUTION_INTERVAL_MS
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const handleStepForward = useCallback(() => {
    setExecutionState((prev) => (prev ? stepForward(prev) : null))
  }, [])

  const handleStepBackward = useCallback(() => {
    setExecutionState((prev) => (prev ? stepBackward(prev) : null))
  }, [])

  const startPlayback = useCallback(
    (state: ExecutionState | null) => {
      if (!state || state.currentStep >= state.totalSteps - 1) return

      setIsRunning(true)

      if (intervalRef.current) clearInterval(intervalRef.current)

      intervalRef.current = setInterval(() => {
        setExecutionState((prev) => {
          if (!prev || prev.currentStep >= prev.totalSteps - 1) {
            stopPlayback()
            return prev
          }
          return stepForward(prev)
        })
      }, playbackInterval)
    },
    [playbackInterval, stopPlayback]
  )

  const handleRunAll = useCallback(() => {
    if (!executionState) return

    const nextState =
      executionState.isComplete ||
      executionState.currentStep >= executionState.totalSteps - 1
        ? resetToStart(executionState)
        : executionState

    if (nextState !== executionState) {
      setExecutionState(nextState)
    }

    startPlayback(nextState)
  }, [executionState, startPlayback])

  const startExecutionPlayback = useCallback(
    (state: ExecutionState) => {
      setExecutionState(state)
      startPlayback(state)
    },
    [startPlayback]
  )

  const startExecutionAndPlayback = useCallback(
    async (
      code: string,
      inputs: InputValues,
      entryPoint?: string,
      language: SupportedLanguage = DEFAULT_LANGUAGE
    ) => {
      stopPlayback()
      const { executeCode } = await import('../lib/runner')
      const state = executeCode(code, inputs, entryPoint, language)
      startExecutionPlayback(state)
      return state
    },
    [startExecutionPlayback, stopPlayback]
  )

  const handlePause = useCallback(() => {
    stopPlayback()
  }, [stopPlayback])

  const handleResetToStart = useCallback(() => {
    stopPlayback()
    setExecutionState((prev) => (prev ? resetToStart(prev) : null))
  }, [stopPlayback])

  const handleSkipToEnd = useCallback(() => {
    stopPlayback()
    setExecutionState((prev) => (prev ? skipToEnd(prev) : null))
  }, [stopPlayback])

  const handleJumpToStep = useCallback(
    (stepIndex: number) => {
      stopPlayback()
      setExecutionState((prev) => {
        if (!prev) return null

        const nextStep = Math.min(Math.max(stepIndex, 0), prev.totalSteps - 1)

        return {
          ...prev,
          currentStep: nextStep,
          isComplete: nextStep >= prev.totalSteps - 1,
        }
      })
    },
    [stopPlayback]
  )

  const startExecution = useCallback(
    async (
      code: string,
      inputs: InputValues,
      entryPoint?: string,
      language: SupportedLanguage = DEFAULT_LANGUAGE
    ) => {
      stopPlayback()
      const { executeCode } = await import('../lib/runner')
      const state = executeCode(code, inputs, entryPoint, language)
      setExecutionState(state)
      return state
    },
    [stopPlayback]
  )

  const clearExecution = useCallback(() => {
    stopPlayback()
    setExecutionState(null)
  }, [stopPlayback])

  useEffect(() => stopPlayback, [stopPlayback])

  return {
    executionState,
    setExecutionState,
    isRunning,
    playbackInterval,
    setPlaybackInterval,
    handleStepForward,
    handleStepBackward,
    handleRunAll,
    handlePause,
    handleResetToStart,
    handleSkipToEnd,
    handleJumpToStep,
    startExecution,
    startExecutionAndPlayback,
    clearExecution,
  }
}
