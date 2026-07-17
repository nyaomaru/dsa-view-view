/** Visualization content supported by the runtime modal. */
export type VisualizationType =
  | 'stack'
  | 'tree'
  | 'tree-graph'
  | 'list-graph'
  | 'dp'
  | 'map'
  | 'area'
  | 'binary-search'
  | 'sliding-window'
  | 'bar-chart'
  | 'graph'
  | 'matrix'
  | 'heap'
  | 'word-ladder'
  | null

/** Opens one visualization for an optional variable and fallback step. */
export type OpenVisualization = (
  type: Exclude<VisualizationType, null>,
  variableName?: string,
  stepIndex?: number,
  followPrimaryList?: boolean
) => void
