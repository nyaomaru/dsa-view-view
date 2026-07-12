import { useState } from 'react'
import type { TreeNodeValue } from '@/entities/data-structure'
import type { ExecutionState } from '@/entities/execution'
import { Button } from '@/shared/ui'
import { formatDisplayValue } from '../lib/display-value'
import { buildTreeReturnTrace } from '../lib/tree-return-trace'

/**
 * Props for TreeGraphVisualizer component.
 */
type TreeGraphVisualizerProps = {
  /** Root tree node to render. */
  data: TreeNodeValue
  /** Variable name shown in labels and aria text. */
  name: string
  /** Optional execution state used for return-trace overlays. */
  state?: ExecutionState
}

/**
 * Positioned tree node used by the SVG tree layout.
 */
type PositionedNode = {
  /** Stable SVG/render id. */
  id: string
  /** Node value displayed inside the circle. */
  value: unknown
  /** X coordinate in SVG units. */
  x: number
  /** Y coordinate in SVG units. */
  y: number
}

/**
 * Directed edge between two positioned tree nodes.
 */
type TreeEdge = {
  /** Stable SVG/render id. */
  id: string
  /** Parent node. */
  from: PositionedNode
  /** Child node. */
  to: PositionedNode
}

const NODE_RADIUS = 1
const LEVEL_HEIGHT = 5
const MIN_NODE_GAP = 4.75
const SVG_PADDING_X = 2
const SVG_PADDING_Y = 2
const RETURN_LABEL_WIDTH = 4.4
const RETURN_LABEL_HEIGHT = 0.9

const formatValue = (value: unknown): string => {
  return formatDisplayValue(value)
}

const getTreeDepth = (node: TreeNodeValue | null): number => {
  if (!node) return 0
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right))
}

const countLeaves = (node: TreeNodeValue | null): number => {
  if (!node) return 0
  if (!node.left && !node.right) return 1
  return countLeaves(node.left) + countLeaves(node.right)
}

function buildTreeLayout(root: TreeNodeValue) {
  const nodes: PositionedNode[] = []
  const edges: TreeEdge[] = []
  const depth = getTreeDepth(root)
  const leafCount = Math.max(countLeaves(root), 1)
  const contentWidth = Math.max((leafCount - 1) * MIN_NODE_GAP, MIN_NODE_GAP)
  let nextLeafX = SVG_PADDING_X + (leafCount === 1 ? contentWidth / 2 : 0)

  const visit = (
    node: TreeNodeValue,
    level: number,
    path: string
  ): PositionedNode => {
    const children: PositionedNode[] = []

    if (node.left) {
      children.push(visit(node.left, level + 1, `${path}.left`))
    }

    if (node.right) {
      children.push(visit(node.right, level + 1, `${path}.right`))
    }

    const x =
      children.length > 0
        ? children.reduce((sum, child) => sum + child.x, 0) / children.length
        : nextLeafX

    if (children.length === 0) {
      nextLeafX += MIN_NODE_GAP
    }

    const positionedNode: PositionedNode = {
      id: path || 'root',
      value: node.val,
      x,
      y: SVG_PADDING_Y + level * LEVEL_HEIGHT,
    }

    nodes.push(positionedNode)
    children.forEach((child) => {
      edges.push({
        id: `${positionedNode.id}-${child.id}`,
        from: positionedNode,
        to: child,
      })
    })

    return positionedNode
  }

  visit(root, 0, 'root')

  return {
    nodes,
    edges,
    width: contentWidth + SVG_PADDING_X * 2,
    height:
      Math.max((depth - 1) * LEVEL_HEIGHT, 0) +
      SVG_PADDING_Y * 2 +
      RETURN_LABEL_HEIGHT,
  }
}

export function TreeGraphVisualizer({
  data,
  name,
  state,
}: TreeGraphVisualizerProps) {
  const [expandedReturnRows, setExpandedReturnRows] = useState<
    Record<string, boolean>
  >({})
  const layout = buildTreeLayout(data)
  const trace = state ? buildTreeReturnTrace(state, data) : undefined
  const traceRows = trace?.rows ?? []
  const hasReturnTrace = traceRows.length > 0
  const shouldShowNodeReturns = Boolean(state)
  const toggleReturnDetail = (rowId: string) => {
    setExpandedReturnRows((current) => ({
      ...current,
      [rowId]: !current[rowId],
    }))
  }

  return (
    <div className="flex h-full min-h-[22rem] w-full flex-col gap-4">
      <div className="text-sm font-semibold text-muted-foreground">
        {name} Tree Graph
      </div>
      <div className="w-full overflow-auto">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="mx-auto h-auto max-h-[32rem] min-w-[28rem] max-w-full"
          role="img"
          aria-label={`${name} binary tree graph`}
        >
          <g className="stroke-foreground">
            {layout.edges.map((edge) => (
              <line
                key={edge.id}
                x1={edge.from.x}
                y1={edge.from.y + NODE_RADIUS}
                x2={edge.to.x}
                y2={edge.to.y - NODE_RADIUS}
                stroke="currentColor"
                strokeWidth="0.075"
              />
            ))}
          </g>

          {layout.nodes.map((node) => {
            const latestReturn = trace?.summaries.get(node.id)?.latestReturn
            const shouldShowReturnLabel =
              shouldShowNodeReturns && latestReturn !== undefined

            return (
              <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
                {shouldShowReturnLabel && (
                  <rect
                    x={-(RETURN_LABEL_WIDTH / 2)}
                    y={1.25}
                    width={RETURN_LABEL_WIDTH}
                    height={RETURN_LABEL_HEIGHT}
                    rx={0.12}
                    className="fill-primary"
                  />
                )}
                <circle
                  r={NODE_RADIUS}
                  className="fill-background stroke-foreground"
                  strokeWidth="0.075"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground font-semibold"
                  fontSize={0.85}
                >
                  {formatValue(node.value)}
                </text>
                {shouldShowReturnLabel && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-primary-foreground font-semibold"
                    fontSize={0.4}
                    y={1.7}
                  >
                    return = {latestReturn}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      {hasReturnTrace && (
        <div className="max-h-56 w-full overflow-auto rounded-md border bg-background">
          <table className="w-full min-w-[32rem] text-left text-xs">
            <thead className="sticky top-0 bg-primary text-primary-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Depth</th>
                <th className="px-3 py-2 font-medium">Call</th>
                <th className="px-3 py-2 font-medium">Path</th>
                <th className="px-3 py-2 font-medium">Return</th>
              </tr>
            </thead>
            <tbody>
              {traceRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{row.depth}</td>
                  <td className="px-3 py-2 font-mono">
                    {row.functionName}({row.argumentName}={row.argumentValue})
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {row.treePath ?? 'null'}
                  </td>
                  <td className="max-w-[18rem] px-3 py-2 font-mono font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 truncate">
                        {row.returnValue}
                      </span>
                      {row.returnDetail && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 px-2 text-xs"
                          onClick={() => toggleReturnDetail(row.id)}
                        >
                          {expandedReturnRows[row.id]
                            ? 'Hide details'
                            : 'Show details'}
                        </Button>
                      )}
                    </div>
                    {row.returnDetail && expandedReturnRows[row.id] && (
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-sm bg-muted p-2 text-[0.6875rem] font-normal text-muted-foreground">
                        {row.returnDetail}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
