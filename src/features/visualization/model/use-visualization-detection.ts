import { useMemo } from 'react'
import type { ExecutionState } from '@/entities/execution'
import { detectVisualizationState } from './visualization-detection/detect-visualization-state'

export { detectVisualizationState } from './visualization-detection/detect-visualization-state'
export type { VisualizationDetection } from './visualization-detection/types'

export function useVisualizationDetection(executionState: ExecutionState) {
  return useMemo(
    () => detectVisualizationState(executionState),
    [executionState]
  )
}
