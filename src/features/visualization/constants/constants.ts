/**
 * Common configuration for visualizations
 */
export const VISUALIZATION_CONSTANTS = {
  DEFAULT_SCROLL_DELAY_MS: 100,
  RECURSION_DEPTH_THRESHOLD: 2,
} as const

/**
 * Graph visualization constants
 */
export const GRAPH_CONFIG = {
  NODE_RADIUS: 20,
  CANVAS_SIZE: 500,
  RADIUS: 180,
  ARROW_HEAD_OFFSET: 5,
  ARROW_MARKER_WIDTH: 10,
  ARROW_MARKER_HEIGHT: 7,
  ARROW_MARKER_REF_X: 9,
  ARROW_MARKER_REF_Y: 3.5,
  SELF_LOOP_RADIUS: 15,
  SELF_LOOP_OFFSET: 10,
  EDGE_STROKE_WIDTH: 2,
  NODE_SPRING_STIFFNESS: 300,
  NODE_SPRING_DAMPING: 20,
} as const

/**
 * Recursion tree visualization constants
 */
export const TREE_CONFIG = {
  INDENT_SIZE: 24,
  CONNECTOR_OFFSET_X: 12,
  CONNECTOR_OFFSET_Y: 10,
  ANIMATION_OFFSET_X: 20,
} as const
