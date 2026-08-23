import type { ReactNode } from 'react'
import { Card } from '@/shared/ui'
import { oneOfValues } from '@/shared/lib/guards'
import type { StockProfitVisualizationState } from '../lib/stock-profit-view'

type PriceStatus =
  | 'current'
  | 'current-sell'
  | 'buy'
  | 'sell'
  | 'processed'
  | 'pending'

const isCurrentPriceStatus = oneOfValues('current', 'current-sell')
const isLabeledPriceStatus = oneOfValues(
  'current',
  'current-sell',
  'buy',
  'sell'
)

type StockProfitVisualizerProps = {
  /** Source-array variable name. */
  name: string
  /** Current stock-profit strategy state. */
  state: StockProfitVisualizationState
}

type PriceProgressItemProps = {
  /** Price value shown for this day. */
  price: number
  /** Zero-based day index. */
  index: number
  /** Strategy state used to derive the day's status. */
  state: StockProfitVisualizationState
}

function Metric({
  label,
  variableName,
  children,
  emphasized = false,
}: {
  label: string
  variableName: string
  children: ReactNode
  emphasized?: boolean
}) {
  return (
    <div
      className={[
        'min-w-36 rounded-md border px-3 py-2',
        emphasized
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-muted/30',
      ].join(' ')}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-3 font-mono">
        <span className="truncate text-xs text-muted-foreground">
          {variableName}
        </span>
        <strong className="text-lg text-foreground">{children}</strong>
      </div>
    </div>
  )
}

function hasExecutedTrade(state: StockProfitVisualizationState): boolean {
  return state.mode === 'single-transaction'
    ? state.profit > 0
    : state.difference > 0
}

function getStrategySummary(state: StockProfitVisualizationState): string {
  if (state.mode === 'single-transaction') {
    return hasExecutedTrade(state)
      ? `buy day ${state.buyIndex} · sell day ${state.sellIndex} · profit ${state.profit}`
      : 'no profitable trade'
  }

  return `${state.difference} > 0${hasExecutedTrade(state) ? ' → add the gain' : ' → skip the loss'}`
}

function getPriceStatus({
  index,
  state,
}: {
  index: number
  state: StockProfitVisualizationState
}): PriceStatus {
  const showsTradeMarker = hasExecutedTrade(state)

  if (index === state.currentIndex) {
    return showsTradeMarker && index === state.sellIndex
      ? 'current-sell'
      : 'current'
  }
  if (showsTradeMarker && index === state.buyIndex) return 'buy'
  if (showsTradeMarker && index === state.sellIndex) return 'sell'
  if (index < state.currentIndex) return 'processed'
  return 'pending'
}

function getPriceStatusLabel(status: PriceStatus): string {
  return status === 'current-sell' ? 'current · sell' : status
}

function getAccessiblePriceStatus(status: PriceStatus): string {
  return status === 'current-sell' ? 'current and sell' : status
}

function getPriceClass(status: PriceStatus): string {
  switch (status) {
    case 'current':
    case 'current-sell':
      return 'border-primary bg-primary text-primary-foreground shadow-sm'
    case 'buy':
      return 'border-primary/40 bg-primary/10 text-foreground'
    case 'sell':
      return 'border-primary bg-secondary text-secondary-foreground'
    case 'processed':
      return 'border-primary/30 bg-primary/5 text-foreground'
    default:
      return 'border-border bg-muted/30 text-muted-foreground'
  }
}

function PriceProgressItem({ price, index, state }: PriceProgressItemProps) {
  const status = getPriceStatus({ index, state })

  return (
    <li
      aria-current={isCurrentPriceStatus(status) ? 'step' : undefined}
      aria-label={`Day ${index}: price ${price}, ${getAccessiblePriceStatus(status)}`}
      className="relative flex flex-col items-center gap-1"
    >
      {isLabeledPriceStatus(status) && (
        <span
          className={[
            'absolute -top-6 font-mono text-xs font-semibold',
            status === 'sell' ? 'text-secondary-foreground' : 'text-primary',
          ].join(' ')}
        >
          {getPriceStatusLabel(status)}
        </span>
      )}
      <div
        className={[
          'flex h-14 w-14 items-center justify-center rounded-md border-2 font-mono text-base transition-colors',
          getPriceClass(status),
        ].join(' ')}
      >
        {price}
      </div>
      <span className="font-mono text-xs text-muted-foreground">{index}</span>
    </li>
  )
}

export function StockProfitVisualizer({
  name,
  state,
}: StockProfitVisualizerProps) {
  const isSingleTransaction = state.mode === 'single-transaction'
  const indexVariable = isSingleTransaction
    ? 'day'
    : state.variableNames.indexName

  return (
    <Card className="w-full border-0 shadow-none">
      <div className="flex flex-col gap-5 p-4">
        <p className="text-xs text-muted-foreground">
          {isSingleTransaction
            ? 'Track the lowest price seen so far and the best profit from one buy and one sell.'
            : 'Add each positive day-to-day price change to the accumulated profit.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <Metric label="Current day" variableName={indexVariable}>
            {state.currentIndex}
          </Metric>
          <Metric
            label="Current price"
            variableName={
              isSingleTransaction
                ? state.variableNames.priceName
                : `${name}[${indexVariable}]`
            }
          >
            {state.currentPrice}
          </Metric>
          {isSingleTransaction ? (
            <Metric
              label="Lowest price"
              variableName={state.variableNames.minimumName}
            >
              {state.minimumPrice}
            </Metric>
          ) : (
            <Metric
              label="Daily change"
              variableName={state.variableNames.differenceName}
            >
              {state.difference}
            </Metric>
          )}
          <Metric
            label={isSingleTransaction ? 'Best profit' : 'Total profit'}
            variableName={state.variableNames.profitName}
            emphasized
          >
            {state.profit}
          </Metric>
        </div>

        <div className="min-w-0 overflow-x-auto pb-2">
          <ol
            aria-label={`${name} stock profit progress`}
            className="flex min-w-max gap-2 pt-6"
          >
            {state.data.map((price, index) => (
              <PriceProgressItem
                key={index}
                price={price}
                index={index}
                state={state}
              />
            ))}
          </ol>
        </div>

        <div className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          {getStrategySummary(state)}
        </div>
      </div>
    </Card>
  )
}
