// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import type { AppMode } from '@/shared/model'

import {
  VIEW_VIEW_ANIMATION_WAIT_MS,
  VIEW_VIEW_ANIMATION_WAIT_SOURCE,
  VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS,
  VIEW_VIEW_MONITOR_INTRO_DURATION_MS,
  VIEW_VIEW_RUNTIME_COMPLETE_FALLBACK_SOURCES,
  getLoopingViewViewAnimationSource,
  pickRuntimeCompleteViewViewAnimationSource,
  pickViewViewAnimationSource,
  selectViewViewAnimationMood,
  useViewViewAnimation,
  useViewViewAnimationState,
} from './use-view-view-animation'

describe('view view animation state', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('prioritizes idle above every app mode', () => {
    expect(
      selectViewViewAnimationMood({
        mode: 'runtime',
        isIdle: true,
        isRunning: true,
        isRuntimeComplete: true,
        compileEventMood: 'compile-error',
      })
    ).toBe('idle')
  })

  it('keeps compile error visible until the next compile reset', () => {
    expect(
      selectViewViewAnimationMood({
        mode: 'verification',
        isIdle: false,
        isRunning: false,
        isRuntimeComplete: false,
        compileEventMood: 'compile-error',
      })
    ).toBe('compile-error')
  })

  it('lets runtime override a previous compile success flash', () => {
    expect(
      selectViewViewAnimationMood({
        mode: 'runtime',
        isIdle: false,
        isRunning: false,
        isRuntimeComplete: false,
        compileEventMood: 'compile-success',
      })
    ).toBe('runtime')
  })

  it('shows ok when runtime is complete', () => {
    expect(
      selectViewViewAnimationMood({
        mode: 'runtime',
        isIdle: false,
        isRunning: false,
        isRuntimeComplete: true,
        compileEventMood: 'compile-success',
      })
    ).toBe('runtime-complete')
  })

  it('shows compile success before falling back to verification', () => {
    expect(
      selectViewViewAnimationMood({
        mode: 'verification',
        isIdle: false,
        isRunning: false,
        isRuntimeComplete: false,
        compileEventMood: 'compile-success',
      })
    ).toBe('compile-success')

    expect(
      selectViewViewAnimationMood({
        mode: 'verification',
        isIdle: false,
        isRunning: false,
        isRuntimeComplete: false,
        compileEventMood: null,
      })
    ).toBe('verification')
  })

  it('randomly picks from the configured animation group', () => {
    expect(pickViewViewAnimationSource('idle', () => 0)).toBe(
      '/view-view-animation/boring.gif'
    )
    expect(pickViewViewAnimationSource('idle', () => 0.5)).toBe(
      '/view-view-animation/drooling.gif'
    )
    expect(pickViewViewAnimationSource('compile-success', () => 0.99)).toBe(
      '/view-view-animation/ok.gif'
    )
    expect(
      pickViewViewAnimationSource(
        'compile-success',
        () => 0.99,
        '/view-view-animation/nomal.gif'
      )
    ).toBe('/view-view-animation/ok.gif')
    expect(pickViewViewAnimationSource('verification', () => 0)).toBe(
      '/view-view-animation/nomal.gif'
    )
  })

  it('mixes runtime completion with normal animations without repeating ok', () => {
    expect(pickRuntimeCompleteViewViewAnimationSource(0, () => 0)).toBe(
      '/view-view-animation/ok.gif'
    )
    expect(pickRuntimeCompleteViewViewAnimationSource(1, () => 0.99)).toBe(
      '/view-view-animation/ok.gif'
    )
    expect(
      pickRuntimeCompleteViewViewAnimationSource(
        1,
        () => 0.99,
        '/view-view-animation/ok.gif'
      )
    ).toBe('/view-view-animation/jump.gif')
    expect(pickRuntimeCompleteViewViewAnimationSource(2, () => 0)).toBe(
      '/view-view-animation/nomal.gif'
    )
    expect(pickRuntimeCompleteViewViewAnimationSource(2, () => 0.99)).toBe(
      '/view-view-animation/jump.gif'
    )
    expect(VIEW_VIEW_RUNTIME_COMPLETE_FALLBACK_SOURCES).toEqual([
      '/view-view-animation/nomal.gif',
      '/view-view-animation/thinking.gif',
      '/view-view-animation/whiskers.gif',
      '/view-view-animation/passing.gif',
      '/view-view-animation/passing 2.gif',
      '/view-view-animation/fluffy.gif',
      '/view-view-animation/drooling.gif',
      '/view-view-animation/ok.gif',
      '/view-view-animation/dance.gif',
      '/view-view-animation/jump.gif',
    ])
  })

  it('builds a looped source that forces the gif to restart', () => {
    expect(
      getLoopingViewViewAnimationSource('/view-view-animation/ok.gif', 2)
    ).toBe('/view-view-animation/ok.gif?loop=2')
  })

  it('matches the configured animation loop switch durations', () => {
    expect(
      VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS['/view-view-animation/sakana.gif']
    ).toBe(2_600)
    expect(
      VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS['/view-view-animation/thinking.gif']
    ).toBe(5_700)
    expect(
      VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS[
        '/view-view-animation/passing 2.gif'
      ]
    ).toBe(4_200)
  })

  it('shows wait before switching to a different gif loop', () => {
    vi.useFakeTimers()
    const randomValues = [0.25, 0]
    const random = () => randomValues.shift() ?? 0

    const { result } = renderHook(() =>
      useViewViewAnimation({
        mode: 'editor',
        compilationResult: null,
        isRunning: false,
        idleTimeoutMs: 60_000,
        initialDisplayMs: 0,
        random,
      })
    )

    expect(result.current).toBe('/view-view-animation/thinking.gif?loop=1')

    act(() => {
      vi.advanceTimersByTime(
        VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS[
          '/view-view-animation/thinking.gif'
        ]
      )
    })

    expect(result.current).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS - 1)
    })

    expect(result.current).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current).toBe('/view-view-animation/nomal.gif?loop=2')
  })

  it('shows wait before switching when the selected mode changes', () => {
    vi.useFakeTimers()
    const randomValues = [0, 0.25]
    const random = () => randomValues.shift() ?? 0

    const { rerender, result } = renderHook(
      ({ mode }) =>
        useViewViewAnimation({
          mode,
          compilationResult: null,
          isRunning: false,
          idleTimeoutMs: 60_000,
          initialDisplayMs: 0,
          random,
        }),
      { initialProps: { mode: 'editor' as AppMode } }
    )

    rerender({ mode: 'verification' })

    expect(result.current).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS)
    })

    expect(result.current).toBe('/view-view-animation/boring.gif?loop=2')
  })

  it('uses wait instead of TV noise as a loop wait frame', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useViewViewAnimation({
        mode: 'editor',
        compilationResult: null,
        isRunning: false,
        idleTimeoutMs: 60_000,
        initialDisplayMs: 0,
        random: () => 0,
      })
    )

    act(() => {
      vi.advanceTimersByTime(
        VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS['/view-view-animation/nomal.gif']
      )
    })

    expect(result.current).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS)
    })

    expect(result.current).toBe('/view-view-animation/thinking.gif?loop=2')
  })

  it('falls back to a different animation after showing runtime complete ok', () => {
    vi.useFakeTimers()

    const randomValues = [0, 0.13, 0.7]
    const random = () => randomValues.shift() ?? 0.99

    const { result } = renderHook(() =>
      useViewViewAnimation({
        mode: 'runtime',
        compilationResult: null,
        isRunning: false,
        isRuntimeComplete: true,
        idleTimeoutMs: 60_000,
        initialDisplayMs: 0,
        random,
      })
    )

    expect(result.current).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS)
    })

    expect(result.current).toBe('/view-view-animation/ok.gif?loop=2')

    act(() => {
      vi.advanceTimersByTime(
        VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS['/view-view-animation/ok.gif']
      )
    })

    expect(result.current).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS)
    })

    expect(result.current).toBe('/view-view-animation/thinking.gif?loop=3')

    act(() => {
      vi.advanceTimersByTime(
        VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS[
          '/view-view-animation/thinking.gif'
        ]
      )
    })

    expect(result.current).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS)
    })

    expect(result.current).toBe('/view-view-animation/ok.gif?loop=4')
  })

  it('starts the loop timer after the gif loads', () => {
    vi.useFakeTimers()
    const randomValues = [0.25, 0]
    const random = () => randomValues.shift() ?? 0

    const { result } = renderHook(() =>
      useViewViewAnimationState({
        mode: 'editor',
        compilationResult: null,
        isRunning: false,
        idleTimeoutMs: 60_000,
        initialDisplayMs: 0,
        random,
      })
    )

    act(() => {
      result.current.onAnimationLoad()
    })

    act(() => {
      vi.advanceTimersByTime(
        VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS[
          '/view-view-animation/thinking.gif'
        ]
      )
    })

    expect(result.current.src).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS)
    })

    expect(result.current.src).toBe('/view-view-animation/nomal.gif?loop=2')
  })

  it('keeps thinking visible until its visual loop endpoint', () => {
    vi.useFakeTimers()
    const randomValues = [0.25, 0]
    const random = () => randomValues.shift() ?? 0

    const { result } = renderHook(() =>
      useViewViewAnimationState({
        mode: 'editor',
        compilationResult: null,
        isRunning: false,
        idleTimeoutMs: 60_000,
        initialDisplayMs: 0,
        random,
      })
    )

    expect(result.current.src).toBe('/view-view-animation/thinking.gif?loop=1')

    act(() => {
      result.current.onAnimationLoad()
    })

    act(() => {
      vi.advanceTimersByTime(
        VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS[
          '/view-view-animation/thinking.gif'
        ] - 1
      )
    })

    expect(result.current.src).toBe('/view-view-animation/thinking.gif?loop=1')

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current.src).toBe(VIEW_VIEW_ANIMATION_WAIT_SOURCE)

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_ANIMATION_WAIT_MS)
    })

    expect(result.current.src).toBe('/view-view-animation/nomal.gif?loop=2')
  })

  it('shows the monitor intro, then starts the first animation', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useViewViewAnimation({
        mode: 'editor',
        compilationResult: null,
        isRunning: false,
        idleTimeoutMs: 60_000,
        random: () => 0,
      })
    )

    expect(result.current).toBeNull()

    act(() => {
      vi.advanceTimersByTime(VIEW_VIEW_MONITOR_INTRO_DURATION_MS)
    })

    expect(result.current).toBe('/view-view-animation/nomal.gif?loop=1')
  })
})
