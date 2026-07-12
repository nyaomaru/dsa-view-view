import type { ListNodeValue } from '@/entities/data-structure'
import { formatDisplayValue } from '../lib/display-value'

/**
 * Props for ListGraphVisualizer component.
 */
type ListGraphVisualizerProps = {
  /** Head node to render, or null for an empty list. */
  data: ListNodeValue | null
  /** Variable name shown in the graph label and SVG aria label. */
  name: string
}

/**
 * Positioned node used by the SVG list layout.
 */
type PositionedListNode = {
  /** Stable SVG/render id. */
  id: string
  /** Node value displayed inside the circle. */
  value: unknown
  /** X coordinate in SVG units. */
  x: number
  /** Y coordinate in SVG units. */
  y: number
  /** Original source node, or null for the synthetic null node. */
  source: ListNodeValue | null
}

/**
 * Computed SVG layout for a linked list graph.
 */
type ListGraphLayout = {
  /** Positioned nodes in traversal order. */
  nodes: PositionedListNode[]
  /** Optional edge from the tail back to a previously seen node. */
  cycleEdge?: {
    /** Node where the cycle edge starts. */
    from: PositionedListNode
    /** Node where the cycle edge points. */
    to: PositionedListNode
  }
  /** SVG viewport width. */
  width: number
  /** SVG viewport height. */
  height: number
}

const NODE_RADIUS = 1
const NODE_GAP = 4
const SVG_PADDING_X = 2
const SVG_PADDING_Y = 2
const BASELINE_Y = 3
const CYCLE_ARC_HEIGHT = 4
const ARROW_MARKER_VIEWBOX = '0 0 10 10'
const ARROW_MARKER_REF_X = 8
const ARROW_MARKER_REF_Y = 5
const ARROW_MARKER_SIZE = 0.55
const ARROW_PATH = 'M 0 0 L 10 5 L 0 10 z'
const EDGE_END_GAP = 0.15
const LIST_EDGE_STROKE_WIDTH = 0.07
const CYCLE_EDGE_STROKE_WIDTH = 0.09
const NODE_STROKE_WIDTH = 0.075
const NULL_NODE_STROKE_DASHARRAY = '0.18 0.12'
const NODE_LABEL_FONT_SIZE = 0.75

const formatValue = (value: unknown): string => {
  return formatDisplayValue(value, { nullLabel: 'null' })
}

function buildNullListGraphLayout(): ListGraphLayout {
  return {
    nodes: [
      {
        id: 'null',
        value: null,
        x: SVG_PADDING_X + NODE_GAP / 2,
        y: BASELINE_Y,
        source: null,
      },
    ],
    width: NODE_GAP + SVG_PADDING_X * 2,
    height: BASELINE_Y + SVG_PADDING_Y * 2,
  }
}

function buildListGraphLayout(head: ListNodeValue | null): ListGraphLayout {
  if (!head) return buildNullListGraphLayout()

  const nodes: PositionedListNode[] = []
  const seen = new Map<ListNodeValue, PositionedListNode>()
  let current: ListNodeValue | null = head
  let cycleEdge: ListGraphLayout['cycleEdge']

  while (current) {
    const existing = seen.get(current)

    if (existing) {
      const from = nodes[nodes.length - 1]
      if (from) {
        cycleEdge = { from, to: existing }
      }
      break
    }

    const node: PositionedListNode = {
      id: `node-${nodes.length}`,
      value: current.val,
      x: SVG_PADDING_X + nodes.length * NODE_GAP,
      y: BASELINE_Y,
      source: current,
    }

    nodes.push(node)
    seen.set(current, node)
    current = current.next
  }

  if (nodes.length === 1) {
    nodes[0].x += NODE_GAP / 2
  }

  return {
    nodes,
    cycleEdge,
    width:
      Math.max((nodes.length - 1) * NODE_GAP, NODE_GAP) + SVG_PADDING_X * 2,
    height: BASELINE_Y + CYCLE_ARC_HEIGHT + SVG_PADDING_Y,
  }
}

export function ListGraphVisualizer({ data, name }: ListGraphVisualizerProps) {
  const layout = buildListGraphLayout(data)

  return (
    <div className="flex h-full min-h-[16rem] w-full flex-col items-center justify-center gap-4">
      <div className="text-sm font-semibold text-muted-foreground">
        {name} List Graph
      </div>
      <div className="w-full overflow-auto">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="mx-auto h-auto min-w-[28rem] max-w-full"
          role="img"
          aria-label={`${name} linked list graph`}
        >
          <defs>
            <marker
              id={`${name}-list-arrow`}
              viewBox={ARROW_MARKER_VIEWBOX}
              refX={ARROW_MARKER_REF_X}
              refY={ARROW_MARKER_REF_Y}
              markerWidth={ARROW_MARKER_SIZE}
              markerHeight={ARROW_MARKER_SIZE}
              orient="auto-start-reverse"
            >
              <path d={ARROW_PATH} className="fill-foreground" />
            </marker>
            <marker
              id={`${name}-cycle-arrow`}
              viewBox={ARROW_MARKER_VIEWBOX}
              refX={ARROW_MARKER_REF_X}
              refY={ARROW_MARKER_REF_Y}
              markerWidth={ARROW_MARKER_SIZE}
              markerHeight={ARROW_MARKER_SIZE}
              orient="auto-start-reverse"
            >
              <path d={ARROW_PATH} className="fill-primary" />
            </marker>
          </defs>

          <g className="stroke-foreground">
            {layout.nodes.slice(0, -1).map((node, index) => {
              const next = layout.nodes[index + 1]

              return (
                <line
                  key={`${node.id}-${next.id}`}
                  x1={node.x + NODE_RADIUS}
                  y1={node.y}
                  x2={next.x - NODE_RADIUS - EDGE_END_GAP}
                  y2={next.y}
                  stroke="currentColor"
                  strokeWidth={LIST_EDGE_STROKE_WIDTH}
                  markerEnd={`url(#${name}-list-arrow)`}
                />
              )
            })}
          </g>

          {layout.cycleEdge && (
            <path
              d={[
                `M ${layout.cycleEdge.from.x} ${layout.cycleEdge.from.y + NODE_RADIUS}`,
                `C ${layout.cycleEdge.from.x} ${layout.cycleEdge.from.y + CYCLE_ARC_HEIGHT}`,
                `${layout.cycleEdge.to.x} ${layout.cycleEdge.to.y + CYCLE_ARC_HEIGHT}`,
                `${layout.cycleEdge.to.x} ${layout.cycleEdge.to.y + NODE_RADIUS + EDGE_END_GAP}`,
              ].join(' ')}
              fill="none"
              className="stroke-primary"
              strokeWidth={CYCLE_EDGE_STROKE_WIDTH}
              markerEnd={`url(#${name}-cycle-arrow)`}
            />
          )}

          {layout.nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
              <circle
                r={NODE_RADIUS}
                className={
                  node.source
                    ? 'fill-background stroke-foreground'
                    : 'fill-muted stroke-muted-foreground'
                }
                strokeWidth={NODE_STROKE_WIDTH}
                strokeDasharray={
                  node.source ? undefined : NULL_NODE_STROKE_DASHARRAY
                }
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground font-semibold"
                fontSize={NODE_LABEL_FONT_SIZE}
              >
                {formatValue(node.value)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
