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
import { isError } from '@/shared/lib/guards'
import { EXECUTION_CONSTANTS } from './constants'
import { executeCodeInWorker } from '../worker/execution-worker-client'

const { EXECUTION_INTERVAL_MS } = EXECUTION_CONSTANTS

function createWorkerFailureState(error: unknown): ExecutionState {
  const message = isError(error) ? error.message : 'Execution worker failed.'

  return {
    currentStep: 0,
    totalSteps: 1,
    steps: [
      {
        stepNumber: 0,
        type: 'return',
        line: 0,
        description: `Error: ${message}`,
        variables: {},
        timestamp: Date.now(),
        callStack: ['root'],
      },
    ],
    isComplete: false,
    error: message,
  }
}

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
  const executionAbortRef = useRef<AbortController | null>(null)

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

  const runExecution = useCallback(
    async (
      code: string,
      inputs: InputValues,
      entryPoint: string | undefined,
      language: SupportedLanguage
    ): Promise<ExecutionState | null> => {
      executionAbortRef.current?.abort()
      const controller = new AbortController()
      executionAbortRef.current = controller

      try {
        return await executeCodeInWorker(code, inputs, entryPoint, language, {
          signal: controller.signal,
        })
      } catch (error) {
        return controller.signal.aborted
          ? null
          : createWorkerFailureState(error)
      } finally {
        if (executionAbortRef.current === controller) {
          executionAbortRef.current = null
        }
      }
    },
    []
  )

  const startExecutionAndPlayback = useCallback(
    async (
      code: string,
      inputs: InputValues,
      entryPoint?: string,
      language: SupportedLanguage = DEFAULT_LANGUAGE
    ) => {
      stopPlayback()
      const state = await runExecution(code, inputs, entryPoint, language)
      if (!state) return null
      startExecutionPlayback(state)
      return state
    },
    [runExecution, startExecutionPlayback, stopPlayback]
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
      const state = await runExecution(code, inputs, entryPoint, language)
      if (!state) return null
      setExecutionState(state)
      return state
    },
    [runExecution, stopPlayback]
  )

  const clearExecution = useCallback(() => {
    executionAbortRef.current?.abort()
    executionAbortRef.current = null
    stopPlayback()
    setExecutionState(null)
  }, [stopPlayback])

  useEffect(
    () => () => {
      executionAbortRef.current?.abort()
      stopPlayback()
    },
    [stopPlayback]
  )

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
