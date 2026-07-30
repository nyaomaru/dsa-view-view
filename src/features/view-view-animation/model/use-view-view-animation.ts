import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppMode } from '@/shared/model'
import type { CompilationResult } from '@/entities/code'

export type ViewViewAnimationMood =
  | 'normal'
  | 'idle'
  | 'compile-success'
  | 'compile-error'
  | 'runtime'
  | 'runtime-complete'
  | 'verification'

type CompileEventMood = Extract<
  ViewViewAnimationMood,
  'compile-success' | 'compile-error'
>

type ViewViewAnimationState = {
  /** Active application mode. */
  mode: AppMode
  /** Whether the user has been inactive long enough to show idle animations. */
  isIdle: boolean
  /** Whether runtime playback is currently running. */
  isRunning: boolean
  /** Whether runtime execution has completed. */
  isRuntimeComplete: boolean
  /** Most recent compile event mood, if one is active. */
  compileEventMood: CompileEventMood | null
}

type UseViewViewAnimationParams = {
  /** Active application mode. */
  mode: AppMode
  /** Latest compilation result, or null before compilation. */
  compilationResult: CompilationResult | null
  /** Whether runtime playback is currently running. */
  isRunning: boolean
  /** Whether runtime execution has completed. */
  isRuntimeComplete?: boolean
  /** Milliseconds of inactivity before switching to idle mood. */
  idleTimeoutMs?: number
  /** Milliseconds to keep compile-success mood active. */
  compileSuccessFlashMs?: number
  /** Milliseconds to show the monitor intro before animations start. */
  initialDisplayMs?: number
  /** Random source used to pick an animation from the active mood. */
  random?: () => number
}

type UseViewViewAnimationResult = {
  /** Current image source to render, or null while showing the monitor intro. */
  src: string | null
  /** Callback fired when the current animation image finishes loading. */
  onAnimationLoad: () => void
}

type PendingViewViewAnimation = {
  /** Animation source to show after the wait frame finishes. */
  source: string
  /** Whether applying this pending animation advances the runtime-complete display count. */
  incrementsRuntimeCompleteCount: boolean
}

export const VIEW_VIEW_ANIMATION_WAIT_SOURCE = '/view-view-animation/wait.png'
export const VIEW_VIEW_ANIMATION_NORMAL_SOURCE =
  '/view-view-animation/nomal.gif'

export const VIEW_VIEW_MONITOR_INTRO_DURATION_MS = 530
export const VIEW_VIEW_IDLE_TIMEOUT_MS = 20_000
export const VIEW_VIEW_COMPILE_SUCCESS_FLASH_MS = 2_500
export const VIEW_VIEW_ANIMATION_WAIT_MS = 10_000
export const VIEW_VIEW_RUNTIME_COMPLETE_OK_DISPLAY_COUNT = 2

const VIEW_VIEW_INITIAL_LOOP_INDEX = 1
const VIEW_VIEW_ACTIVITY_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
  'input',
  'focus',
] as const

export const VIEW_VIEW_ANIMATION_SOURCES: Record<
  ViewViewAnimationMood,
  string[]
> = {
  normal: [
    VIEW_VIEW_ANIMATION_NORMAL_SOURCE,
    '/view-view-animation/thinking.gif',
    '/view-view-animation/whiskers.gif',
    '/view-view-animation/passing.gif',
    '/view-view-animation/passing 2.gif',
    '/view-view-animation/fluffy.gif',
    '/view-view-animation/drooling.gif',
  ],
  idle: [
    '/view-view-animation/boring.gif',
    '/view-view-animation/sleeping.gif',
    VIEW_VIEW_ANIMATION_NORMAL_SOURCE,
    '/view-view-animation/whiskers.gif',
    '/view-view-animation/runny.gif',
    '/view-view-animation/drooling.gif',
    '/view-view-animation/dizzy.gif',
    '/view-view-animation/crying.gif',
    '/view-view-animation/awkward.gif',
    '/view-view-animation/sakana.gif',
  ],
  'compile-success': [
    '/view-view-animation/laugh.gif',
    VIEW_VIEW_ANIMATION_NORMAL_SOURCE,
    '/view-view-animation/jump.gif',
    '/view-view-animation/fluffy.gif',
    '/view-view-animation/ok.gif',
  ],
  'compile-error': [
    '/view-view-animation/shock.gif',
    VIEW_VIEW_ANIMATION_NORMAL_SOURCE,
    '/view-view-animation/dizzy.gif',
    '/view-view-animation/crying.gif',
    '/view-view-animation/awkward.gif',
  ],
  runtime: [
    '/view-view-animation/sakana.gif',
    '/view-view-animation/laugh.gif',
    '/view-view-animation/boring.gif',
    VIEW_VIEW_ANIMATION_NORMAL_SOURCE,
    '/view-view-animation/fluffy.gif',
  ],
  'runtime-complete': [
    '/view-view-animation/ok.gif',
    VIEW_VIEW_ANIMATION_NORMAL_SOURCE,
    '/view-view-animation/dance.gif',
    '/view-view-animation/jump.gif',
    '/view-view-animation/fluffy.gif',
  ],
  verification: [
    VIEW_VIEW_ANIMATION_NORMAL_SOURCE,
    '/view-view-animation/laugh.gif',
    '/view-view-animation/boring.gif',
    '/view-view-animation/trembling.gif',
    '/view-view-animation/whiskers.gif',
  ],
}

export const VIEW_VIEW_RUNTIME_COMPLETE_FALLBACK_SOURCES = Array.from(
  new Set([
    ...VIEW_VIEW_ANIMATION_SOURCES.normal,
    ...VIEW_VIEW_ANIMATION_SOURCES['runtime-complete'],
  ])
)

export const VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS: Record<string, number> = {
  '/view-view-animation/awkward.gif': 3_600,
  '/view-view-animation/boring.gif': 2_500,
  '/view-view-animation/crying.gif': 4_100,
  '/view-view-animation/dance.gif': 3_400,
  '/view-view-animation/dizzy.gif': 3_300,
  '/view-view-animation/drooling.gif': 4_100,
  '/view-view-animation/fluffy.gif': 3_600,
  '/view-view-animation/jump.gif': 2_300,
  '/view-view-animation/laugh.gif': 3_300,
  '/view-view-animation/nomal.gif': 6_000,
  '/view-view-animation/ok.gif': 2_600,
  '/view-view-animation/passing.gif': 2_500,
  '/view-view-animation/passing 2.gif': 4_200,
  '/view-view-animation/runny.gif': 5_200,
  '/view-view-animation/sakana.gif': 2_600,
  '/view-view-animation/shock.gif': 3_700,
  '/view-view-animation/sleeping.gif': 4_500,
  // thinking.gif returns to the same pose as wait.png on its final frame.
  // Switch at that visual endpoint instead of the full 6.1s file duration.
  '/view-view-animation/thinking.gif': 5_700,
  '/view-view-animation/trembling.gif': 2_100,
  '/view-view-animation/whiskers.gif': 4_000,
}

export function selectViewViewAnimationMood({
  mode,
  isIdle,
  isRunning,
  isRuntimeComplete,
  compileEventMood,
}: ViewViewAnimationState): ViewViewAnimationMood {
  if (isIdle) return 'idle'
  if (compileEventMood === 'compile-error') return 'compile-error'
  if (mode === 'runtime' && isRuntimeComplete) return 'runtime-complete'
  if (mode === 'runtime' || isRunning) return 'runtime'
  if (compileEventMood === 'compile-success') return 'compile-success'
  if (mode === 'verification') return 'verification'

  return 'normal'
}

export function pickViewViewAnimationSource(
  mood: ViewViewAnimationMood,
  random: () => number = Math.random,
  previousSource: string | null = null
): string {
  return pickViewViewAnimationSourceFrom(
    VIEW_VIEW_ANIMATION_SOURCES[mood],
    random,
    previousSource
  )
}

function pickViewViewAnimationSourceFrom(
  sources: string[],
  random: () => number,
  previousSource: string | null = null
): string {
  const selectableSources =
    sources.length > 1 && previousSource !== null
      ? sources.filter((source) => source !== previousSource)
      : sources
  const index = Math.min(
    selectableSources.length - 1,
    Math.floor(random() * selectableSources.length)
  )

  return selectableSources[index]
}

export function pickRuntimeCompleteViewViewAnimationSource(
  displayCount: number,
  random: () => number = Math.random,
  previousSource: string | null = null
): string {
  const completeSource = VIEW_VIEW_ANIMATION_SOURCES['runtime-complete'][0]

  if (
    displayCount < VIEW_VIEW_RUNTIME_COMPLETE_OK_DISPLAY_COUNT &&
    previousSource !== completeSource
  ) {
    return completeSource
  }

  return pickViewViewAnimationSourceFrom(
    VIEW_VIEW_RUNTIME_COMPLETE_FALLBACK_SOURCES,
    random,
    previousSource
  )
}

export function getLoopingViewViewAnimationSource(
  source: string,
  loopIndex: number
): string {
  return `${source}?loop=${loopIndex}`
}

export function useViewViewAnimationState({
  mode,
  compilationResult,
  isRunning,
  isRuntimeComplete = false,
  idleTimeoutMs = VIEW_VIEW_IDLE_TIMEOUT_MS,
  compileSuccessFlashMs = VIEW_VIEW_COMPILE_SUCCESS_FLASH_MS,
  initialDisplayMs = VIEW_VIEW_MONITOR_INTRO_DURATION_MS,
  random = Math.random,
}: UseViewViewAnimationParams): UseViewViewAnimationResult {
  const lastAnimationSrcRef = useRef<string | null>(null)
  const randomRef = useRef(random)
  const [isIdle, setIsIdle] = useState(false)
  const [isInitialDisplay, setIsInitialDisplay] = useState(
    () => initialDisplayMs > 0
  )
  const [compileEventMood, setCompileEventMood] =
    useState<CompileEventMood | null>(null)
  const [animationSrc, setAnimationSrc] = useState(() => {
    const initialSource = pickViewViewAnimationSource('normal', random)
    lastAnimationSrcRef.current = initialSource
    return initialSource
  })
  const [animationLoopIndex, setAnimationLoopIndex] = useState(
    VIEW_VIEW_INITIAL_LOOP_INDEX
  )
  const [loadedAnimationLoopIndex, setLoadedAnimationLoopIndex] = useState<
    number | null
  >(null)
  const [pendingAnimation, setPendingAnimation] =
    useState<PendingViewViewAnimation | null>(null)
  const compileSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const runtimeCompleteDisplayCountRef = useRef(0)
  const hasHandledMoodRef = useRef(false)

  useEffect(() => {
    randomRef.current = random
  }, [random])

  const updateAnimationSrc = useCallback((nextAnimationSrc: string) => {
    lastAnimationSrcRef.current = nextAnimationSrc
    setAnimationSrc(nextAnimationSrc)
  }, [])

  const waitForNextAnimation = useCallback(
    (
      nextAnimationSrc: string,
      incrementsRuntimeCompleteCount: boolean = false
    ) => {
      setLoadedAnimationLoopIndex(null)
      setPendingAnimation({
        source: nextAnimationSrc,
        incrementsRuntimeCompleteCount,
      })
    },
    []
  )

  useEffect(() => {
    if (initialDisplayMs <= 0) {
      setIsInitialDisplay(false)
      return
    }

    const initialDisplayTimer = setTimeout(() => {
      setIsInitialDisplay(false)
    }, initialDisplayMs)

    return () => {
      clearTimeout(initialDisplayTimer)
    }
  }, [initialDisplayMs])

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null

    const markActive = () => {
      setIsIdle(false)

      if (idleTimer !== null) {
        clearTimeout(idleTimer)
      }

      idleTimer = setTimeout(() => {
        setIsIdle(true)
      }, idleTimeoutMs)
    }

    VIEW_VIEW_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true })
    })
    markActive()

    return () => {
      if (idleTimer !== null) {
        clearTimeout(idleTimer)
      }

      VIEW_VIEW_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActive)
      })
    }
  }, [idleTimeoutMs])

  useEffect(() => {
    if (compileSuccessTimerRef.current !== null) {
      clearTimeout(compileSuccessTimerRef.current)
      compileSuccessTimerRef.current = null
    }

    if (compilationResult === null) {
      setCompileEventMood(null)
      return
    }

    if (!compilationResult.success) {
      setCompileEventMood('compile-error')
      return
    }

    setCompileEventMood('compile-success')
    compileSuccessTimerRef.current = setTimeout(() => {
      setCompileEventMood(null)
      compileSuccessTimerRef.current = null
    }, compileSuccessFlashMs)

    return () => {
      if (compileSuccessTimerRef.current !== null) {
        clearTimeout(compileSuccessTimerRef.current)
        compileSuccessTimerRef.current = null
      }
    }
  }, [compilationResult, compileSuccessFlashMs])

  const mood = useMemo(
    () =>
      selectViewViewAnimationMood({
        mode,
        isIdle,
        isRunning,
        isRuntimeComplete,
        compileEventMood,
      }),
    [compileEventMood, isIdle, isRunning, isRuntimeComplete, mode]
  )

  useEffect(() => {
    const isInitialMood = !hasHandledMoodRef.current

    if (isInitialMood) {
      hasHandledMoodRef.current = true

      if (mood === 'normal') {
        return
      }
    }

    const nextAnimationSrc =
      mood === 'runtime-complete'
        ? pickRuntimeCompleteViewViewAnimationSource(
            0,
            randomRef.current,
            lastAnimationSrcRef.current
          )
        : pickViewViewAnimationSource(
            mood,
            randomRef.current,
            lastAnimationSrcRef.current
          )

    runtimeCompleteDisplayCountRef.current = mood === 'runtime-complete' ? 1 : 0
    waitForNextAnimation(nextAnimationSrc)
  }, [mood, waitForNextAnimation])

  useEffect(() => {
    if (
      isInitialDisplay ||
      pendingAnimation !== null ||
      loadedAnimationLoopIndex !== animationLoopIndex
    ) {
      return
    }

    const loopDurationMs = VIEW_VIEW_ANIMATION_LOOP_DURATIONS_MS[animationSrc]

    if (loopDurationMs === undefined) {
      return
    }

    const loopTimer = setTimeout(() => {
      const nextAnimationSrc =
        mood === 'runtime-complete'
          ? pickRuntimeCompleteViewViewAnimationSource(
              runtimeCompleteDisplayCountRef.current,
              randomRef.current,
              lastAnimationSrcRef.current
            )
          : pickViewViewAnimationSource(
              mood,
              randomRef.current,
              lastAnimationSrcRef.current
            )

      if (mood === 'runtime-complete') {
        waitForNextAnimation(nextAnimationSrc, true)
        return
      }

      waitForNextAnimation(nextAnimationSrc)
    }, loopDurationMs)

    return () => {
      clearTimeout(loopTimer)
    }
  }, [
    animationLoopIndex,
    animationSrc,
    isInitialDisplay,
    loadedAnimationLoopIndex,
    mood,
    pendingAnimation,
    waitForNextAnimation,
  ])

  useEffect(() => {
    if (pendingAnimation === null) {
      return
    }

    const waitTimer = setTimeout(() => {
      updateAnimationSrc(pendingAnimation.source)

      if (pendingAnimation.incrementsRuntimeCompleteCount) {
        runtimeCompleteDisplayCountRef.current += 1
      }

      setAnimationLoopIndex((currentLoopIndex) => currentLoopIndex + 1)
      setLoadedAnimationLoopIndex(null)
      setPendingAnimation(null)
    }, VIEW_VIEW_ANIMATION_WAIT_MS)

    return () => {
      clearTimeout(waitTimer)
    }
  }, [pendingAnimation, updateAnimationSrc])

  const onAnimationLoad = useCallback(() => {
    if (isInitialDisplay || pendingAnimation !== null) {
      return
    }

    setLoadedAnimationLoopIndex(animationLoopIndex)
  }, [animationLoopIndex, isInitialDisplay, pendingAnimation])

  if (isInitialDisplay) {
    return { src: null, onAnimationLoad }
  }

  if (pendingAnimation !== null) {
    return { src: VIEW_VIEW_ANIMATION_WAIT_SOURCE, onAnimationLoad }
  }

  return {
    src: getLoopingViewViewAnimationSource(animationSrc, animationLoopIndex),
    onAnimationLoad,
  }
}

export function useViewViewAnimation(
  params: UseViewViewAnimationParams
): string | null {
  const { src, onAnimationLoad } = useViewViewAnimationState(params)

  useEffect(() => {
    if (src !== null) {
      onAnimationLoad()
    }
  }, [onAnimationLoad, src])

  return src
}
