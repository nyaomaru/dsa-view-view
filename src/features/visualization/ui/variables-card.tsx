import { useEffect, useMemo, useState } from 'react'
import {
  BarChart2,
  Calculator,
  CheckSquare,
  GitGraph,
  Grid3X3,
  Search,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
} from '@/shared/ui'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { isUndefined } from '@/shared/lib/guards'
import { VariableRow } from './variable-row'
import { VariableChangeNavigator } from './variable-change-navigator'
import type { OpenVisualization } from '../model/types'
import {
  findPreviousVariableChange,
  getVariableChangeAtStep,
} from '../lib/variable-change-navigation'

/**
 * Props for VariablesCard component.
 */
type VariablesCardProps = {
  /** Full execution state used to find variable changes. */
  executionState: ExecutionState
  /** Currently selected execution step. */
  currentStep?: ExecutionStep
  /** Variable entries visible at the current step. */
  variableEntries: [string, unknown][]
  /** Expanded/collapsed state keyed by variable name. */
  expandedVariables: Record<string, boolean>
  /** Whether the execution trace includes recursive calls. */
  hasRecursion: boolean
  /** Whether the call tree comes from class-design operations. */
  isClassDesignTrace?: boolean
  /** First step containing a prepared min/max heap pair. */
  primaryHeapStepIndex?: number
  /** First step containing Word Ladder inputs. */
  primaryWordLadderStepIndex?: number
  /** First step containing Basic Calculator-style expression state. */
  primaryExpressionStepIndex?: number
  /** Primary array variable detected for chart visualization. */
  primaryArrayName?: string
  /** Primary numeric array detected for container-area visualization. */
  primaryAreaArrayName?: string
  /** Step index where area pointers are available. */
  primaryAreaStepIndex?: number
  /** Primary numeric array detected for binary-search index visualization. */
  primaryBinarySearchArrayName?: string
  /** Step index where binary-search indexes are available. */
  primaryBinarySearchStepIndex?: number
  /** Primary string variable detected for sliding-window visualization. */
  primarySlidingWindowStringName?: string
  /** Step index where sliding-window indexes are available. */
  primarySlidingWindowStepIndex?: number
  /** Primary state source detected for DP visualization. */
  primaryDpName?: string
  /** Primary semantic Map variable detected for Map View. */
  primaryMapName?: string
  /** Step index where Map View context is first available. */
  primaryMapStepIndex?: number
  /** Primary graph variable detected for graph visualization. */
  primaryGraphName?: string
  /** Primary matrix variable detected for matrix visualization. */
  primaryMatrixName?: string
  /** Step index where the primary matrix is first available. */
  primaryMatrixStepIndex?: number
  /** Primary tree node variable detected for tree graph visualization. */
  primaryTreeNodeName?: string
  /** TreeNode variable names that changed during execution. */
  visualizableTreeNodeNames?: string[]
  /** Primary list node variable detected for list graph visualization. */
  primaryListNodeName?: string
  /** ListNode variable names that remain visualizable even when currently null. */
  visualizableListNodeNames?: string[]
  /** Toggles detail expansion for a variable. */
  onToggleVariable: (variableName: string) => void
  /** Opens a primary or inline visualization. */
  onOpenVisualization: OpenVisualization
  /** Jumps to a specific zero-based execution step index. */
  onJumpToStep: (stepIndex: number) => void
}

export function VariablesCard({
  executionState,
  currentStep,
  variableEntries,
  expandedVariables,
  hasRecursion,
  isClassDesignTrace = false,
  primaryHeapStepIndex,
  primaryWordLadderStepIndex,
  primaryExpressionStepIndex,
  primaryArrayName,
  primaryAreaArrayName,
  primaryAreaStepIndex,
  primaryBinarySearchArrayName,
  primaryBinarySearchStepIndex,
  primarySlidingWindowStringName,
  primarySlidingWindowStepIndex,
  primaryDpName,
  primaryMapName,
  primaryMapStepIndex,
  primaryGraphName,
  primaryMatrixName,
  primaryMatrixStepIndex,
  primaryTreeNodeName,
  visualizableTreeNodeNames = [],
  primaryListNodeName,
  visualizableListNodeNames = [],
  onToggleVariable,
  onOpenVisualization,
  onJumpToStep,
}: VariablesCardProps) {
  const [selectedVariableName, setSelectedVariableName] = useState<
    string | undefined
  >(undefined)
  const previousChange = useMemo(
    () =>
      selectedVariableName
        ? findPreviousVariableChange(
            executionState,
            selectedVariableName,
            executionState.currentStep
          )
        : undefined,
    [executionState, selectedVariableName]
  )
  const currentChange = selectedVariableName
    ? getVariableChangeAtStep(
        executionState,
        selectedVariableName,
        executionState.currentStep
      )
    : undefined

  useEffect(() => {
    setSelectedVariableName(undefined)
  }, [executionState.steps])

  const handlePreviousChange = () => {
    if (isUndefined(previousChange)) return
    onJumpToStep(previousChange.stepIndex)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="space-y-1.5">
          <CardTitle>Variables</CardTitle>
          <CardDescription>Current variable states</CardDescription>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {!isUndefined(primaryWordLadderStepIndex) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization(
                  'word-ladder',
                  undefined,
                  primaryWordLadderStepIndex
                )
              }
            >
              <GitGraph className="w-4 h-4" />
              Word Ladder View
            </Button>
          )}
          {!isUndefined(primaryHeapStepIndex) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization('heap', undefined, primaryHeapStepIndex)
              }
            >
              <BarChart2 className="w-4 h-4" />
              Heap View
            </Button>
          )}
          {!isUndefined(primaryExpressionStepIndex) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization(
                  'expression',
                  undefined,
                  primaryExpressionStepIndex
                )
              }
            >
              <Calculator className="w-4 h-4" />
              Expression View
            </Button>
          )}
          {primaryArrayName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onOpenVisualization('bar-chart', primaryArrayName)}
            >
              <BarChart2 className="w-4 h-4" />
              Sort Graph
            </Button>
          )}
          {primaryAreaArrayName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization(
                  'area',
                  primaryAreaArrayName,
                  primaryAreaStepIndex
                )
              }
            >
              <BarChart2 className="w-4 h-4" />
              Area View
            </Button>
          )}
          {primaryBinarySearchArrayName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization(
                  'binary-search',
                  primaryBinarySearchArrayName,
                  primaryBinarySearchStepIndex
                )
              }
            >
              <Search className="w-4 h-4" />
              Index View
            </Button>
          )}
          {primarySlidingWindowStringName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization(
                  'sliding-window',
                  primarySlidingWindowStringName,
                  primarySlidingWindowStepIndex
                )
              }
            >
              <Search className="w-4 h-4" />
              Sliding Window View
            </Button>
          )}
          {primaryDpName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onOpenVisualization('dp', primaryDpName)}
            >
              <CheckSquare className="w-4 h-4" />
              DP View
            </Button>
          )}
          {primaryMapName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization('map', primaryMapName, primaryMapStepIndex)
              }
            >
              <Search className="w-4 h-4" />
              Map View
            </Button>
          )}
          {primaryGraphName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onOpenVisualization('graph', primaryGraphName)}
            >
              <GitGraph className="w-4 h-4" />
              Graph View
            </Button>
          )}
          {hasRecursion && !primaryTreeNodeName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onOpenVisualization('tree')}
            >
              <GitGraph className="w-4 h-4" />
              {isClassDesignTrace ? 'Call Stack View' : 'Tree View'}
            </Button>
          )}
          {primaryMatrixName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization(
                  'matrix',
                  primaryMatrixName,
                  primaryMatrixStepIndex
                )
              }
            >
              <Grid3X3 className="w-4 h-4" />
              Matrix View
            </Button>
          )}
          {primaryTreeNodeName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization('tree-graph', primaryTreeNodeName)
              }
            >
              <GitGraph className="w-4 h-4" />
              Tree Graph
            </Button>
          )}
          {primaryListNodeName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                onOpenVisualization(
                  'list-graph',
                  primaryListNodeName,
                  undefined,
                  true
                )
              }
            >
              <GitGraph className="w-4 h-4" />
              List Graph
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStep && variableEntries.length > 0 ? (
          <>
            <VariableChangeNavigator
              variableNames={variableEntries.map(([name]) => name)}
              selectedVariableName={selectedVariableName}
              previousChange={previousChange}
              currentChange={currentChange}
              onSelectedVariableChange={setSelectedVariableName}
              onPreviousChange={handlePreviousChange}
            />
            <Stack spacing="xs">
              {variableEntries.map(([name, value]) => (
                <VariableRow
                  key={name}
                  name={name}
                  value={value}
                  isSelected={name === selectedVariableName}
                  expandedVariables={expandedVariables}
                  visualizableTreeNodeNames={visualizableTreeNodeNames}
                  visualizableListNodeNames={visualizableListNodeNames}
                  onToggleVariable={onToggleVariable}
                  onOpenVisualization={onOpenVisualization}
                />
              ))}
            </Stack>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No variables to display
          </p>
        )}
      </CardContent>
    </Card>
  )
}
