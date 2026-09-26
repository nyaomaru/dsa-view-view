import { describe, expect, it } from 'vite-plus/test'
import type { ExecutionState } from '@/entities/execution'

import {
  getSlidingWindowState,
  getSlidingWindowVisualizationState,
} from './sliding-window-view'

describe('getSlidingWindowState', () => {
  it('recognizes abbreviated boundaries and a t pattern', () => {
    expect(
      getSlidingWindowState('ADOBECODEBANC', {
        s: 'ADOBECODEBANC',
        t: 'ABC',
        l: 0,
        r: 5,
      })
    ).toEqual({
      left: 0,
      right: 5,
      rangeMode: 'inclusive',
      pattern: 'ABC',
    })
  })

  it('recognizes a half-open unique-character window', () => {
    expect(
      getSlidingWindowState('abba', {
        s: 'abba',
        set: new Set(['b', 'a']),
        left: 2,
        right: 4,
        best: 2,
      })
    ).toEqual({
      left: 2,
      right: 4,
      rangeMode: 'half-open',
      windowSize: 2,
      setValues: ['b', 'a'],
      best: 2,
    })
  })

  it('keeps array-length right bounds exclusive to Set-backed windows', () => {
    expect(
      getSlidingWindowState('abc', {
        s: 'abc',
        left: 0,
        right: 3,
      })
    ).toBeNull()

    expect(
      getSlidingWindowState('abc', {
        s: 'abc',
        set: new Set(['a', 'b', 'c']),
        left: 0,
        right: 3,
        best: 3,
      })
    ).toMatchObject({
      right: 3,
      rangeMode: 'half-open',
    })
  })

  it('keeps Set-backed inclusive windows inclusive when their size matches', () => {
    expect(
      getSlidingWindowState('abc', {
        s: 'abc',
        set: new Set(['a', 'b', 'c']),
        left: 0,
        right: 2,
        best: 3,
      })
    ).toMatchObject({
      left: 0,
      right: 2,
      rangeMode: 'inclusive',
      windowSize: 3,
      best: 3,
    })
  })

  it('validates boundaries using Unicode code points', () => {
    expect(
      getSlidingWindowState('😀😀', {
        s: '😀😀',
        set: new Set(['😀']),
        left: 1,
        right: 2,
        best: 1,
      })
    ).toMatchObject({
      left: 1,
      right: 2,
      rangeMode: 'half-open',
      windowSize: 1,
    })

    expect(
      getSlidingWindowState('😀😀', {
        s: '😀😀',
        set: new Set(['😀']),
        left: 1,
        right: 4,
        best: 1,
      })
    ).toBeNull()
  })

  it('retains the pointer aliases from the displayed window step', () => {
    const executionState: ExecutionState = {
      currentStep: 0,
      totalSteps: 1,
      isComplete: false,
      steps: [
        {
          stepNumber: 0,
          type: 'assignment',
          line: 1,
          description: 'window state',
          timestamp: 0,
          variables: { s: 'abc', left: 0, right: 1, l: 99, r: 99 },
        },
      ],
    }

    expect(
      getSlidingWindowVisualizationState({ executionState, variableName: 's' })
    ).toMatchObject({ pointerNames: ['left', 'right'] })
  })
})
