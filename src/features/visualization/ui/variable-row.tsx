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

const INLINE_VISUALIZATION_BUTTON_CLASS = 'h-8 w-8 shrink-0'
const INLINE_VISUALIZATION_ICON_CLASS = 'h-3.5 w-3.5'
const RESULT_VARIABLE_NAME = 'result'

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
  /** Opens stack visualization for the variable. */
  onOpenStack: (variableName: string) => void
  /** Opens bar chart visualization for the variable. */
  onOpenBarChart: (variableName: string) => void
  /** Opens boolean array DP visualization for the variable. */
  onOpenBooleanArray: (variableName: string) => void
  /** Opens graph visualization for the variable. */
  onOpenGraph: (variableName: string) => void
  /** Opens matrix visualization for the variable. */
  onOpenMatrix: (variableName: string) => void
  /** Opens tree graph visualization for the variable. */
  onOpenTreeGraph: (variableName: string) => void
  /** Opens linked-list graph visualization for the variable. */
  onOpenListGraph: (variableName: string) => void
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
  /** Opens stack visualization for the variable. */
  onOpenStack: (variableName: string) => void
  /** Opens bar chart visualization for the variable. */
  onOpenBarChart: (variableName: string) => void
  /** Opens boolean array DP visualization for the variable. */
  onOpenBooleanArray: (variableName: string) => void
  /** Opens graph visualization for the variable. */
  onOpenGraph: (variableName: string) => void
  /** Opens matrix visualization for the variable. */
  onOpenMatrix: (variableName: string) => void
  /** Opens tree graph visualization for the variable. */
  onOpenTreeGraph: (variableName: string) => void
  /** Opens linked-list graph visualization for the variable. */
  onOpenListGraph: (variableName: string) => void
}

type InlineVisualizationAvailability = {
  /** Whether stack visualization can be shown. */
  array: boolean
  /** Whether boolean array DP visualization can be shown. */
  booleanArray: boolean
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
  const dataStructure = name !== RESULT_VARIABLE_NAME

  return {
    array: isArray(value),
    booleanArray:
      dataStructure &&
      (isBooleanArray(value) ||
        (name.toLowerCase() === 'dp' && isNumericArray(value))) &&
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
  onOpenStack,
  onOpenBarChart,
  onOpenBooleanArray,
  onOpenGraph,
  onOpenMatrix,
  onOpenTreeGraph,
  onOpenListGraph,
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
          onClick={() => onOpenTreeGraph(name)}
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
          onClick={() => onOpenListGraph(name)}
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
          onClick={() => onOpenGraph(name)}
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
            onClick={() => onOpenStack(name)}
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
                onClick={() => onOpenBarChart(name)}
              >
                <BarChart2 className={INLINE_VISUALIZATION_ICON_CLASS} />
              </Button>
            )}
          {availability.booleanArray && (
            <Button
              variant="ghost"
              size="icon"
              className={INLINE_VISUALIZATION_BUTTON_CLASS}
              title="Visualize as DP table"
              onClick={() => onOpenBooleanArray(name)}
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
                onClick={() => onOpenGraph(name)}
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
                onClick={() => onOpenMatrix(name)}
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
  onOpenStack,
  onOpenBarChart,
  onOpenBooleanArray,
  onOpenGraph,
  onOpenMatrix,
  onOpenTreeGraph,
  onOpenListGraph,
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
          onOpenStack={onOpenStack}
          onOpenBarChart={onOpenBarChart}
          onOpenBooleanArray={onOpenBooleanArray}
          onOpenGraph={onOpenGraph}
          onOpenMatrix={onOpenMatrix}
          onOpenTreeGraph={onOpenTreeGraph}
          onOpenListGraph={onOpenListGraph}
        />
      </div>
    </div>
  )
}
