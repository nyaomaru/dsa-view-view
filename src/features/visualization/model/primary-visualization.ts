import type { VisualizationDetection } from './visualization-detection/types'
import type { VisualizationType } from './types'
import { isUndefined } from '@/shared/lib/guards'

export type PrimaryVisualization = {
  /** Modal content selected for the execution trace. */
  type: Exclude<VisualizationType, null>
  /** Variable targeted by the selected content. */
  targetVariable?: string
  /** Optional fallback step containing compatible context. */
  targetStepIndex?: number
  /** Whether a list view should continue following the primary pointer. */
  followPrimaryList?: boolean
}

/** Selects the highest-priority visualization available for an execution. */
export function getPrimaryVisualization(
  detection: VisualizationDetection
): PrimaryVisualization | null {
  if (!isUndefined(detection.primaryWordLadderStepIndex)) {
    return {
      type: 'word-ladder',
      targetStepIndex: detection.primaryWordLadderStepIndex,
    }
  }

  if (!isUndefined(detection.primaryHeapStepIndex)) {
    return {
      type: 'heap',
      targetStepIndex: detection.primaryHeapStepIndex,
    }
  }

  if (!isUndefined(detection.primaryExpressionStepIndex)) {
    return {
      type: 'expression',
      targetStepIndex: detection.primaryExpressionStepIndex,
    }
  }

  if (detection.primaryAreaArrayName) {
    return {
      type: 'area',
      targetVariable: detection.primaryAreaArrayName,
      targetStepIndex: detection.primaryAreaStepIndex,
    }
  }

  if (detection.primaryBinarySearchArrayName) {
    return {
      type: 'binary-search',
      targetVariable: detection.primaryBinarySearchArrayName,
      targetStepIndex: detection.primaryBinarySearchStepIndex,
    }
  }

  if (detection.primarySlidingWindowStringName) {
    return {
      type: 'sliding-window',
      targetVariable: detection.primarySlidingWindowStringName,
      targetStepIndex: detection.primarySlidingWindowStepIndex,
    }
  }

  if (detection.primaryStackName) {
    return { type: 'stack', targetVariable: detection.primaryStackName }
  }

  if (detection.primaryArrayName) {
    return { type: 'bar-chart', targetVariable: detection.primaryArrayName }
  }

  if (detection.primaryDpName) {
    return { type: 'dp', targetVariable: detection.primaryDpName }
  }

  if (detection.primaryMapName) {
    return {
      type: 'map',
      targetVariable: detection.primaryMapName,
      targetStepIndex: detection.primaryMapStepIndex,
    }
  }

  if (detection.primaryGraphName) {
    return { type: 'graph', targetVariable: detection.primaryGraphName }
  }

  if (detection.primaryMatrixName) {
    return {
      type: 'matrix',
      targetVariable: detection.primaryMatrixName,
      targetStepIndex: detection.primaryMatrixStepIndex,
    }
  }

  if (detection.primaryTreeNodeName) {
    return {
      type: 'tree-graph',
      targetVariable: detection.primaryTreeNodeName,
    }
  }

  if (detection.primaryListNodeName) {
    return {
      type: 'list-graph',
      targetVariable: detection.primaryListNodeName,
      followPrimaryList: true,
    }
  }

  return null
}
