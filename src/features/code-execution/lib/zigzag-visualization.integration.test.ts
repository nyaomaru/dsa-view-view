import { describe, expect, it } from 'vite-plus/test'

import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import { getZigzagVisualizationState } from '@/features/visualization/lib/zigzag-view'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'

import { executeCode } from './runner'

const zigzagExample = ALGORITHM_EXAMPLES.find(
  (example) => example.id === 'zigzag-conversion'
)

if (!zigzagExample) {
  throw new Error('Zigzag Conversion example is missing')
}

describe('Zigzag Conversion visualization integration', () => {
  it('tracks row buffers as characters move down and up the zigzag', () => {
    const state = executeCode(
      zigzagExample.sourceCode,
      { s: 'PAYPALISHIRING', numRows: 3 },
      'convert'
    )
    const completedState = { ...state, currentStep: state.steps.length - 1 }
    const detection = detectVisualizationState(completedState)
    const view = getZigzagVisualizationState(
      completedState,
      detection.primaryZigzagStepIndex
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe('PAHNAPLSIIGYIR')
    expect(detection.primaryZigzagStepIndex).toBeDefined()
    expect(view).toMatchObject({
      rows: ['PAHN', 'APLSIIG', 'YIR'],
      processedCharacterCount: 14,
      row: 2,
      direction: 1,
    })
    expect(getPrimaryVisualization(detection)).toEqual({
      type: 'zigzag',
      targetStepIndex: detection.primaryZigzagStepIndex,
    })
  })
})
