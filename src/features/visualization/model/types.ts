/** Visualization content supported by the runtime modal. */
export type VisualizationType =
  | 'dfs-comparison'
  | 'expression'
  | 'stack'
  | 'tree'
  | 'tree-graph'
  | 'list-graph'
  | 'dp'
  | 'map'
  | 'area'
  | 'max-subarray'
  | 'jump-game'
  | 'stock-profit'
  | 'capacity-search'
  | 'first-missing-positive'
  | 'binary-search'
  | 'sliding-window'
  | 'zigzag'
  | 'bar-chart'
  | 'graph'
  | 'matrix'
  | 'heap'
  | 'word-ladder'
  | 'regex-match'
  | 'n-queens'
  | null

/** Opens one visualization for an optional variable and fallback step. */
export type OpenVisualization = (
  type: Exclude<VisualizationType, null>,
  variableName?: string,
  stepIndex?: number,
  followPrimaryList?: boolean
) => void
