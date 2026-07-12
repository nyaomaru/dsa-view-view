import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  GitGraph,
  Grid3X3,
  Layers,
} from 'lucide-react'
import {
  isGraphNodeShape,
  isListNodeShape,
  isTreeNodeShape,
} from '@/entities/data-structure'
import {
  isArray,
  isBooleanArray,
  equals,
  isMatrix,
  isNestedArray,
  isNull,
  isNumericArray,
  isPlainObject,
} from '@/shared/lib/guards'
import { Button } from '@/shared/ui'
import {
  getCollapsedValueLabel,
  stringifyValue,
  VALUE_PREVIEW_LIMIT,
} from '../lib/value-formatting'
import { isAdjacencyListCandidate } from '../lib/graph-view'
import { isDpVariableName } from '../lib/dp-view'
import type { OpenVisualization } from '../model/types'

const INLINE_VISUALIZATION_BUTTON_CLASS = 'h-8 w-8 shrink-0'
const INLINE_VISUALIZATION_ICON_CLASS = 'h-3.5 w-3.5'
const isResultVariableName = equals('result')

type VariableValuePreviewProps = {
  /** Raw runtime value to preview. */
  value: unknown
  /** Pre-serialized value used for inline display. */
  serializedValue: string
  /** Whether object-like values should be collapsed by default. */
  shouldHideByDefault: boolean
  /** Whether long serialized values should be truncated. */
  shouldTruncate: boolean
  /** Whether the variable details are expanded. */
  isExpanded: boolean
}

type InlineVisualizationActionsProps = {
  /** Variable name targeted by inline visualization actions. */
  name: string
  /** Runtime value used to decide which actions can render. */
  value: unknown
  /** Computed availability flags for inline visualizations. */
  availability: InlineVisualizationAvailability
  /** Opens an inline visualization for the variable. */
  onOpenVisualization: OpenVisualization
}

type VariableRowProps = {
  /** Variable name displayed in the row. */
  name: string
  /** Current runtime value for the variable. */
  value: unknown
  /** Expanded/collapsed state keyed by variable name. */
  expandedVariables: Record<string, boolean>
  /** Tree node variable names that can be visualized as tree graphs. */
  visualizableTreeNodeNames?: string[]
  /** Linked-list variable names that remain visualizable when currently null. */
  visualizableListNodeNames?: string[]
  /** Toggles the variable detail preview. */
  onToggleVariable: (variableName: string) => void
  /** Opens an inline visualization for the variable. */
  onOpenVisualization: OpenVisualization
}

type InlineVisualizationAvailability = {
  /** Whether stack visualization can be shown. */
  array: boolean
  /** Whether DP visualization can be shown. */
  dpArray: boolean
  /** Whether tree graph visualization can be shown. */
  treeNode: boolean
  /** Whether linked-list graph visualization can be shown. */
  listNode: boolean
  /** Whether graph-node visualization can be shown. */
  graphNode: boolean
  /** Whether the variable is not a result-only value. */
  dataStructure: boolean
}

function getInlineVisualizationAvailability({
  name,
  value,
  visualizableTreeNodeNames,
  visualizableListNodeNames,
}: {
  /** Variable name being evaluated. */
  name: string
  /** Runtime value being evaluated. */
  value: unknown
  /** Tree node variable names that can be visualized as tree graphs. */
  visualizableTreeNodeNames: string[]
  /** Linked-list variable names that remain visualizable when currently null. */
  visualizableListNodeNames: string[]
}): InlineVisualizationAvailability {
  const dataStructure = !isResultVariableName(name)

  return {
    array: isArray(value),
    dpArray:
      dataStructure &&
      (isBooleanArray(value) ||
        (isDpVariableName(name.toLowerCase()) && isNumericArray(value))) &&
      value.length > 0,
    treeNode:
      dataStructure &&
      visualizableTreeNodeNames.includes(name) &&
      isTreeNodeShape(value),
    listNode:
      dataStructure &&
      (isListNodeShape(value) ||
        (isNull(value) && visualizableListNodeNames.includes(name))),
    graphNode: dataStructure && isGraphNodeShape(value),
    dataStructure,
  }
}

function VariableValuePreview({
  value,
  serializedValue,
  shouldHideByDefault,
  shouldTruncate,
  isExpanded,
}: VariableValuePreviewProps) {
  const needsToggle = shouldHideByDefault || shouldTruncate

  if (!needsToggle || isExpanded) {
    return (
      <code className="mr-2 font-mono text-sm text-muted-foreground">
        {serializedValue}
      </code>
    )
  }

  if (shouldHideByDefault) {
    return (
      <p className="text-sm text-muted-foreground">
        {getCollapsedValueLabel(value)}. Open details to inspect it.
      </p>
    )
  }

  return (
    <code className="mr-2 truncate font-mono text-sm text-muted-foreground">
      {serializedValue}
    </code>
  )
}

function InlineVisualizationActions({
  name,
  value,
  availability,
  onOpenVisualization,
}: InlineVisualizationActionsProps) {
  if (
    !availability.array &&
    !availability.treeNode &&
    !availability.listNode &&
    !availability.graphNode
  ) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {availability.treeNode && (
        <Button
          variant="ghost"
          size="icon"
          className={INLINE_VISUALIZATION_BUTTON_CLASS}
          title="Visualize as tree graph"
          onClick={() => onOpenVisualization('tree-graph', name)}
        >
          <GitGraph className={INLINE_VISUALIZATION_ICON_CLASS} />
        </Button>
      )}
      {availability.listNode && (
        <Button
          variant="ghost"
          size="icon"
          className={INLINE_VISUALIZATION_BUTTON_CLASS}
          title="Visualize as list graph"
          onClick={() => onOpenVisualization('list-graph', name)}
        >
          <GitGraph className={INLINE_VISUALIZATION_ICON_CLASS} />
        </Button>
      )}
      {availability.graphNode && (
        <Button
          variant="ghost"
          size="icon"
          className={INLINE_VISUALIZATION_BUTTON_CLASS}
          title="Visualize as graph"
          onClick={() => onOpenVisualization('graph', name)}
        >
          <GitGraph className={INLINE_VISUALIZATION_ICON_CLASS} />
        </Button>
      )}
      {availability.array && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={INLINE_VISUALIZATION_BUTTON_CLASS}
            title="Visualize as stack"
            onClick={() => onOpenVisualization('stack', name)}
          >
            <Layers className={INLINE_VISUALIZATION_ICON_CLASS} />
          </Button>
          {availability.dataStructure &&
            isNumericArray(value) &&
            value.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className={INLINE_VISUALIZATION_BUTTON_CLASS}
                title="Visualize as bar chart"
                onClick={() => onOpenVisualization('bar-chart', name)}
              >
                <BarChart2 className={INLINE_VISUALIZATION_ICON_CLASS} />
              </Button>
            )}
          {availability.dpArray && (
            <Button
              variant="ghost"
              size="icon"
              className={INLINE_VISUALIZATION_BUTTON_CLASS}
              title="Visualize as DP table"
              onClick={() => onOpenVisualization('dp', name)}
            >
              <CheckSquare className={INLINE_VISUALIZATION_ICON_CLASS} />
            </Button>
          )}
          {availability.dataStructure &&
            isAdjacencyListCandidate(name, value) && (
              <Button
                variant="ghost"
                size="icon"
                className={INLINE_VISUALIZATION_BUTTON_CLASS}
                title="Visualize as graph"
                onClick={() => onOpenVisualization('graph', name)}
              >
                <GitGraph className={INLINE_VISUALIZATION_ICON_CLASS} />
              </Button>
            )}
          {availability.dataStructure &&
            isMatrix(value) &&
            !isAdjacencyListCandidate(name, value) && (
              <Button
                variant="ghost"
                size="icon"
                className={INLINE_VISUALIZATION_BUTTON_CLASS}
                title="Visualize as grid matrix"
                onClick={() => onOpenVisualization('matrix', name)}
              >
                <Grid3X3 className={INLINE_VISUALIZATION_ICON_CLASS} />
              </Button>
            )}
        </>
      )}
    </div>
  )
}

export function VariableRow({
  name,
  value,
  expandedVariables,
  visualizableTreeNodeNames = [],
  visualizableListNodeNames = [],
  onToggleVariable,
  onOpenVisualization,
}: VariableRowProps) {
  const serializedValue = stringifyValue(value)
  const shouldHideByDefault = isPlainObject(value) || isNestedArray(value)
  const shouldTruncate = serializedValue.length > VALUE_PREVIEW_LIMIT
  const needsToggle = shouldHideByDefault || shouldTruncate
  const isExpanded = expandedVariables[name] ?? false
  const visualizationAvailability = getInlineVisualizationAvailability({
    name,
    value,
    visualizableTreeNodeNames,
    visualizableListNodeNames,
  })

  return (
    <div className="rounded-md bg-secondary p-2 text-secondary-foreground">
      <div className="flex items-center justify-between gap-3">
        <code className="font-mono text-sm font-medium">{name}</code>
        {needsToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => onToggleVariable(name)}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <VariableValuePreview
          value={value}
          serializedValue={serializedValue}
          shouldHideByDefault={shouldHideByDefault}
          shouldTruncate={shouldTruncate}
          isExpanded={isExpanded}
        />
        <InlineVisualizationActions
          name={name}
          value={value}
          availability={visualizationAvailability}
          onOpenVisualization={onOpenVisualization}
        />
      </div>
    </div>
  )
}
