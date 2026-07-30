import { useEffect, useState } from 'react'
import { VIEW_VIEW_MONITOR_INTRO_DURATION_MS } from '../model/use-view-view-animation'

type ViewViewMonitorProps = {
  /** Current View View animation image source. */
  viewViewAnimationSrc: string | null
  /** Callback when the current View View animation image loads. */
  onViewViewAnimationLoad?: () => void
  /** Additional classes for the monitor frame wrapper. */
  className?: string
}

const VIEW_VIEW_MONITOR_NOISE_SOURCE = '/view-view-animation/TV noise.gif'
const VIEW_VIEW_WAIT_FALLBACK_SOURCE = '/view-view-animation/wait.png'
const VIEW_VIEW_MONITOR_FRAME_SOURCE = '/TV moniter.png'
const VIEW_VIEW_MONITOR_ON_TRANSITION_SOURCE =
  '/view-view-animation/TV-moniter.gif'
const VIEW_VIEW_MONITOR_OFF_TRANSITION_SOURCE =
  '/view-view-animation/TV-moniter-off.gif'
const VIEW_VIEW_FLIPPED_SOURCES = new Set(['/view-view-animation/passing.gif'])

export function ViewViewMonitor({
  viewViewAnimationSrc,
  onViewViewAnimationLoad,
  className = '',
}: ViewViewMonitorProps) {
  const isMonitorNoise = viewViewAnimationSrc === VIEW_VIEW_MONITOR_NOISE_SOURCE
  const [loadedViewViewSrc, setLoadedViewViewSrc] = useState<string | null>(
    null
  )
  const [isScreenVisible, setIsScreenVisible] = useState(true)
  const [transitionTarget, setTransitionTarget] = useState<boolean | null>(null)
  const [transitionSequence, setTransitionSequence] = useState(0)
  const [displaySequence, setDisplaySequence] = useState(0)
  const isTransitioning = transitionTarget !== null
  const shouldRenderAnimation = isScreenVisible && !isTransitioning
  const isViewViewImageLoaded =
    viewViewAnimationSrc !== null && loadedViewViewSrc === viewViewAnimationSrc
  const shouldShowScreenFrame = viewViewAnimationSrc !== null && !isMonitorNoise
  const shouldShowScreenFallback =
    viewViewAnimationSrc !== null && !isViewViewImageLoaded
  const shouldFlipAnimation =
    viewViewAnimationSrc !== null &&
    VIEW_VIEW_FLIPPED_SOURCES.has(viewViewAnimationSrc)

  useEffect(() => {
    setLoadedViewViewSrc(null)
  }, [viewViewAnimationSrc])

  useEffect(() => {
    if (transitionTarget === null) {
      return
    }

    const timerId = window.setTimeout(() => {
      setIsScreenVisible(transitionTarget)
      setTransitionTarget(null)

      if (transitionTarget) {
        setDisplaySequence((current) => current + 1)
      }
    }, VIEW_VIEW_MONITOR_INTRO_DURATION_MS)

    return () => window.clearTimeout(timerId)
  }, [transitionTarget])

  const handleViewViewImageLoad = () => {
    if (viewViewAnimationSrc === null) {
      return
    }

    setLoadedViewViewSrc(viewViewAnimationSrc)
    onViewViewAnimationLoad?.()
  }

  const handleScreenToggle = () => {
    if (isTransitioning) {
      return
    }

    setTransitionSequence((current) => current + 1)
    setTransitionTarget(!isScreenVisible)
  }

  return (
    <div className={className}>
      <button
        type="button"
        aria-label={isScreenVisible ? 'Hide TV View' : 'Show TV View'}
        disabled={isTransitioning}
        className="relative mx-auto block aspect-[1000/320] w-full cursor-pointer overflow-hidden bg-transparent p-0 transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait"
        onClick={handleScreenToggle}
      >
        <img
          src={VIEW_VIEW_MONITOR_FRAME_SOURCE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
        />
        {(isTransitioning || viewViewAnimationSrc === null) && (
          <img
            key={isTransitioning ? transitionSequence : 'monitor-intro'}
            src={
              transitionTarget === false
                ? VIEW_VIEW_MONITOR_OFF_TRANSITION_SOURCE
                : VIEW_VIEW_MONITOR_ON_TRANSITION_SOURCE
            }
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
        {shouldRenderAnimation && isMonitorNoise && (
          <img
            key={`${viewViewAnimationSrc}-${displaySequence}`}
            src={VIEW_VIEW_MONITOR_NOISE_SOURCE}
            alt=""
            aria-hidden="true"
            onLoad={handleViewViewImageLoad}
            className={[
              'absolute inset-0 h-full w-full object-contain',
              isViewViewImageLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        )}
        {shouldRenderAnimation &&
          (shouldShowScreenFrame || shouldShowScreenFallback) && (
            <div className="absolute left-[8%] top-[27%] h-[57%] w-[78%] overflow-hidden rounded-[20%] bg-[#181d17]">
              {shouldShowScreenFallback && (
                <img
                  src={VIEW_VIEW_WAIT_FALLBACK_SOURCE}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain"
                />
              )}
              {!isMonitorNoise && (
                <img
                  key={`${viewViewAnimationSrc}-${displaySequence}`}
                  src={viewViewAnimationSrc}
                  alt="View View animation"
                  onLoad={handleViewViewImageLoad}
                  className={[
                    'absolute inset-0 h-full w-full object-contain',
                    shouldFlipAnimation ? 'scale-x-[-1]' : '',
                    isViewViewImageLoaded ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                />
              )}
            </div>
          )}
      </button>
    </div>
  )
}
