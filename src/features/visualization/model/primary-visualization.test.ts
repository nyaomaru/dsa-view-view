import { describe, expect, it } from 'vite-plus/test'

import type { VisualizationDetection } from './visualization-detection/types'
import { getPrimaryVisualization } from './primary-visualization'

const emptyDetection: VisualizationDetection = {
  currentStep: undefined,
  variableEntries: [],
  hasRecursion: false,
  isClassDesignTrace: false,
  primaryHeapStepIndex: undefined,
  primaryStackName: undefined,
  primaryArrayName: undefined,
  primaryAreaArrayName: undefined,
  primaryAreaStepIndex: undefined,
  primaryBinarySearchArrayName: undefined,
  primaryBinarySearchStepIndex: undefined,
  primarySlidingWindowStringName: undefined,
  primarySlidingWindowStepIndex: undefined,
  primaryDpName: undefined,
  primaryMapName: undefined,
  primaryMapStepIndex: undefined,
  primaryGraphName: undefined,
  primaryMatrixName: undefined,
  primaryMatrixStepIndex: undefined,
  primaryTreeNodeName: undefined,
  visualizableTreeNodeNames: [],
  primaryListNodeName: undefined,
  visualizableListNodeNames: [],
}

describe('getPrimaryVisualization', () => {
  it('prioritizes prepared dual-heap traces', () => {
    expect(
      getPrimaryVisualization({
        ...emptyDetection,
        primaryHeapStepIndex: 3,
        primaryStackName: 'answer',
      })
    ).toEqual({ type: 'heap' })
  })

  it('maps detected candidates to their modal configuration', () => {
    expect(
      getPrimaryVisualization({
        ...emptyDetection,
        primaryMapName: 'seen',
        primaryMapStepIndex: 4,
      })
    ).toEqual({ type: 'map', targetVariable: 'seen', targetStepIndex: 4 })

    expect(
      getPrimaryVisualization({
        ...emptyDetection,
        primaryListNodeName: 'head',
      })
    ).toEqual({
      type: 'list-graph',
      targetVariable: 'head',
      followPrimaryList: true,
    })
  })

  it('keeps specialized index views ahead of generic candidates', () => {
    expect(
      getPrimaryVisualization({
        ...emptyDetection,
        primaryAreaArrayName: 'height',
        primaryDpName: 'dp',
        primaryMapName: 'seen',
      })
    ).toEqual({
      type: 'area',
      targetVariable: 'height',
      targetStepIndex: undefined,
    })
  })

  it('returns null when no visualization is available', () => {
    expect(getPrimaryVisualization(emptyDetection)).toBeNull()
  })
})
