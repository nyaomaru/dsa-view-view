import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isArray, isObject } from '@/shared/lib/guards'
import { pxToRem } from '@/shared/lib/units'
import { GRAPH_CONFIG } from '../constants/constants'

/**
 * Normalized graph source accepted by the graph visualizer.
 */
type GraphSource = readonly unknown[] | Readonly<Record<PropertyKey, unknown>>

/**
 * Props for GraphVisualizer component.
 */
type GraphVisualizerProps = {
  /** Adjacency list: number[][] or Map<number, number[]> */
  data: unknown
  /** Variable name */
  name: string
  /** Optional node states for coloring */
  nodeStates?: readonly unknown[]
}

const graphToken = (name: string) => `rgb(var(${name}))`

const STATE_COLORS: Record<number, string> = {
  0: graphToken('--graph-node-unvisited'),
  1: graphToken('--graph-node-visiting'),
  2: graphToken('--graph-node-visited'),
}

const GRAPH_EDGE_COLOR = graphToken('--graph-edge')
const GRAPH_NODE_FOREGROUND_COLOR = graphToken('--graph-node-foreground')

const {
  NODE_RADIUS,
  CANVAS_SIZE,
  RADIUS,
  ARROW_HEAD_OFFSET,
  ARROW_MARKER_WIDTH,
  ARROW_MARKER_HEIGHT,
  ARROW_MARKER_REF_X,
  ARROW_MARKER_REF_Y,
  SELF_LOOP_RADIUS,
  SELF_LOOP_OFFSET,
  EDGE_STROKE_WIDTH,
  NODE_SPRING_STIFFNESS,
  NODE_SPRING_DAMPING,
} = GRAPH_CONFIG

const CENTER = CANVAS_SIZE / 2

/**
 * Visualizes a directed graph from an adjacency list
 */
export function GraphVisualizer({
  data,
  name,
  nodeStates,
}: GraphVisualizerProps) {
  // Normalize adjacency list to number[][] or Map<number, number[]>
  const adjacencyList = useMemo<GraphSource>(() => {
    if (isArray(data)) return data
    if (isObject(data)) return data
    return []
  }, [data])

  const nodeIds = useMemo(() => {
    if (isArray(adjacencyList)) {
      return Array.from({ length: adjacencyList.length }, (_, i) => i)
    }
    return Object.keys(adjacencyList)
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
  }, [adjacencyList])

  const nodePositions = useMemo(() => {
    const positions: Record<number, { x: number; y: number }> = {}
    const count = nodeIds.length
    nodeIds.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      positions[id] = {
        x: CENTER + RADIUS * Math.cos(angle),
        y: CENTER + RADIUS * Math.sin(angle),
      }
    })
    return positions
  }, [nodeIds])

  const edges = useMemo(() => {
    const result: { from: number; to: number; id: string }[] = []
    nodeIds.forEach((from) => {
      const targets = adjacencyList[from]
      if (isArray(targets)) {
        targets.forEach((to) => {
          const target = Number(to)
          if (Number.isFinite(target)) {
            result.push({ from, to: target, id: `${from}-${target}` })
          }
        })
      }
    })
    return result
  }, [nodeIds, adjacencyList])

  // Helper to calculate edge line with offset from node radius
  const getEdgeCoords = (fromIdx: number, toIdx: number) => {
    const from = nodePositions[fromIdx]
    const to = nodePositions[toIdx]
    if (!from || !to) return null

    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) return null

    // Unit vector
    const ux = dx / distance
    const uy = dy / distance

    return {
      x1: from.x + ux * NODE_RADIUS,
      y1: from.y + uy * NODE_RADIUS,
      x2: to.x - ux * (NODE_RADIUS + ARROW_HEAD_OFFSET), // Offset for arrow head
      y2: to.y - uy * (NODE_RADIUS + ARROW_HEAD_OFFSET),
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold">{name} (Graph)</h3>
        {nodeStates && (
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATE_COLORS[0] }}
              />
              <span>Unvisited</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATE_COLORS[1] }}
              />
              <span>Visiting</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATE_COLORS[2] }}
              />
              <span>Visited</span>
            </div>
          </div>
        )}
      </div>

      <div
        className="relative border rounded-xl overflow-hidden bg-muted/20"
        style={{ width: pxToRem(CANVAS_SIZE), height: pxToRem(CANVAS_SIZE) }}
      >
        <svg
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          className="w-full h-full"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth={ARROW_MARKER_WIDTH}
              markerHeight={ARROW_MARKER_HEIGHT}
              refX={ARROW_MARKER_REF_X}
              refY={ARROW_MARKER_REF_Y}
              orient="auto"
            >
              <polygon
                points={`0 0, ${ARROW_MARKER_WIDTH} ${ARROW_MARKER_REF_Y}, 0 ${ARROW_MARKER_HEIGHT}`}
                fill={GRAPH_EDGE_COLOR}
              />
            </marker>
          </defs>

          {/* Edges */}
          <g>
            {edges.map((edge) => {
              const coords = getEdgeCoords(edge.from, edge.to)
              if (!coords) return null

              const isSelfLoop = edge.from === edge.to
              if (isSelfLoop) {
                const p = nodePositions[edge.from]
                return (
                  <path
                    key={edge.id}
                    d={`M ${p.x - SELF_LOOP_OFFSET} ${p.y - NODE_RADIUS} A ${SELF_LOOP_RADIUS} ${SELF_LOOP_RADIUS} 0 1 1 ${p.x + SELF_LOOP_OFFSET} ${p.y - NODE_RADIUS}`}
                    fill="none"
                    stroke={GRAPH_EDGE_COLOR}
                    strokeWidth={EDGE_STROKE_WIDTH}
                    markerEnd="url(#arrowhead)"
                  />
                )
              }

              return (
                <motion.line
                  key={edge.id}
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke={GRAPH_EDGE_COLOR}
                  strokeWidth={EDGE_STROKE_WIDTH}
                  markerEnd="url(#arrowhead)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )
            })}
          </g>

          {/* Nodes */}
          <AnimatePresence>
            {nodeIds.map((id) => {
              const pos = nodePositions[id]
              const state = Number(nodeStates?.[id] ?? 0)
              const color = STATE_COLORS[state] || STATE_COLORS[0]

              return (
                <motion.g
                  key={id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, x: pos.x, y: pos.y }}
                  exit={{ scale: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: NODE_SPRING_STIFFNESS,
                    damping: NODE_SPRING_DAMPING,
                  }}
                >
                  <motion.circle
                    r={NODE_RADIUS}
                    fill={color}
                    stroke={GRAPH_NODE_FOREGROUND_COLOR}
                    strokeWidth={EDGE_STROKE_WIDTH}
                    className="shadow-sm"
                    animate={{ fill: color }}
                  />
                  <text
                    textAnchor="middle"
                    dy=".3em"
                    fill={GRAPH_NODE_FOREGROUND_COLOR}
                    className="select-none font-bold text-xs"
                    style={{ pointerEvents: 'none' }}
                  >
                    {id}
                  </text>
                </motion.g>
              )
            })}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  )
}
