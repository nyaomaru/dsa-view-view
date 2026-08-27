import { Card } from '@/shared/ui'
import type {
  CapacityPackageState,
  CapacitySearchVisualizationState,
} from '../lib/capacity-search-view'

type CapacitySearchVisualizerProps = {
  /** Package-array variable name. */
  name: string
  /** Current capacity-search state. */
  state: CapacitySearchVisualizationState
}

function Metric({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div
      className={[
        'min-w-32 rounded-md border px-3 py-2',
        emphasized
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-muted/30',
      ].join(' ')}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <strong className="mt-1 block font-mono text-lg text-foreground">
        {value}
      </strong>
    </div>
  )
}

function CapacityBound({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: number
  emphasized?: boolean
}) {
  return (
    <div
      className={[
        'rounded border px-2 py-2',
        emphasized
          ? 'border-primary bg-primary/10 font-bold text-primary'
          : 'border-border bg-background',
      ].join(' ')}
    >
      <span
        className={[
          'block text-[0.6875rem]',
          emphasized ? '' : 'text-muted-foreground',
        ].join(' ')}
      >
        {label}
      </span>
      {value}
    </div>
  )
}

function getPackageClass(
  packageState: CapacityPackageState,
  currentIndex: number
): string {
  if (packageState.index === currentIndex) {
    return 'border-primary bg-primary text-primary-foreground shadow-sm'
  }
  if (packageState.index < currentIndex) {
    return 'border-primary/30 bg-primary/5 text-foreground'
  }
  return 'border-border bg-muted/30 text-muted-foreground'
}

function PackageProgressItem({
  packageState,
  previousDay,
  currentIndex,
}: {
  packageState: CapacityPackageState
  previousDay?: number
  currentIndex: number
}) {
  const isCurrent = packageState.index === currentIndex
  const startsDay = previousDay !== packageState.day

  return (
    <li
      aria-current={isCurrent ? 'step' : undefined}
      aria-label={`Index ${packageState.index}: weight ${packageState.weight}, day ${packageState.day}${isCurrent ? ', current' : ''}`}
      className={[
        'relative flex flex-col items-center gap-1',
        startsDay ? 'ml-3 border-l border-dashed border-primary pl-3' : '',
      ].join(' ')}
    >
      <span className="absolute -top-6 whitespace-nowrap font-mono text-[0.6875rem] font-semibold text-primary">
        {startsDay ? `day ${packageState.day}` : ''}
      </span>
      <div
        className={[
          'flex h-14 w-14 items-center justify-center rounded-md border-2 font-mono text-base transition-colors',
          getPackageClass(packageState, currentIndex),
        ].join(' ')}
      >
        {packageState.weight}
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        {packageState.index}
      </span>
    </li>
  )
}

export function CapacitySearchVisualizer({
  name,
  state,
}: CapacitySearchVisualizerProps) {
  const status = state.canShip ? 'fits' : 'needs more days'

  return (
    <Card className="w-full border-0 shadow-none">
      <div className="flex flex-col gap-5 p-4">
        <p className="text-xs text-muted-foreground">
          Binary-search the ship capacity, then greedily load packages in their
          original order.
        </p>

        <div className="rounded-md border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Capacity search range</span>
            <span className="font-mono">
              max weight → total weight ({state.totalWeight})
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <CapacityBound label="left" value={state.left} />
            <CapacityBound
              label={state.isConverged ? 'result · capacity' : 'mid · capacity'}
              value={state.capacity}
              emphasized
            />
            <CapacityBound label="right" value={state.right} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Metric label="Total weight" value={String(state.totalWeight)} />
          <Metric
            label="Current load"
            value={`${state.currentLoad} / ${state.capacity}`}
            emphasized
          />
          <Metric
            label="Days used"
            value={`${state.requiredDays} / ${state.targetDays}`}
          />
          <Metric label="Feasibility" value={status} />
        </div>

        <div className="min-w-0 overflow-x-auto pb-2">
          <ol
            aria-label={`${name} capacity progress`}
            className="flex min-w-max gap-2 pt-6"
          >
            {state.packages.map((packageState) => (
              <PackageProgressItem
                key={packageState.index}
                packageState={packageState}
                previousDay={state.packages[packageState.index - 1]?.day}
                currentIndex={state.currentIndex}
              />
            ))}
          </ol>
        </div>

        <div className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          {name}[{state.currentIndex}] = {state.currentWeight} · day{' '}
          {state.requiredDays} load = {state.currentLoad}
        </div>
      </div>
    </Card>
  )
}
