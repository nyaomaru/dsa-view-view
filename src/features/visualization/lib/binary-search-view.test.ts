import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'
import {
  getBinarySearchRangeMode,
  isBinarySearchArrayCandidate,
} from './binary-search-view'

const values = [1, 3, 5, 7, 9, 11]

function createState(
  snapshots: Array<Record<string, unknown>>
): ExecutionState {
  return {
    currentStep: snapshots.length - 1,
    totalSteps: snapshots.length,
    isComplete: false,
    steps: snapshots.map((variables, stepNumber) => ({
      stepNumber,
      type: 'assignment',
      line: stepNumber + 1,
      description: 'binary-search update',
      variables: { values, ...variables },
      timestamp: stepNumber,
    })),
  }
}

describe('binary-search view', () => {
  it('accepts the array length as a half-open right boundary', () => {
    const variables = { values, left: 0, right: values.length, mid: 3 }

    expect(isBinarySearchArrayCandidate('values', values, variables)).toBe(true)
    expect(getBinarySearchRangeMode(createState([variables]), 'values')).toBe(
      'half-open'
    )
  })

  it('preserves half-open mode after the right boundary narrows', () => {
    const state = createState([
      { left: 0, right: values.length, mid: 3 },
      { left: 0, right: 3, mid: 3 },
    ])

    expect(getBinarySearchRangeMode(state, 'values')).toBe('half-open')
  })
})
