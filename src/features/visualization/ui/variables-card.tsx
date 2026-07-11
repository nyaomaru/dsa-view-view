import { BarChart2, CheckSquare, GitGraph, Grid3X3, Search } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
} from '@/shared/ui'
import type { ExecutionStep } from '@/entities/execution'
import { VariableRow } from './variable-row'

/**
 * Props for VariablesCard component.
 */
type VariablesCardProps = {
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
  /** Primary boolean array variable detected for DP visualization. */
  primaryBooleanArrayName?: string
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
  /** Opens stack visualization for a variable. */
  onOpenStack: (variableName: string) => void
  /** Opens bar chart visualization for a variable. */
  onOpenBarChart: (variableName: string) => void
  /** Opens container-area visualization for a variable. */
  onOpenArea: (variableName: string, stepIndex?: number) => void
  /** Opens binary-search index visualization for a variable. */
  onOpenBinarySearch: (variableName: string, stepIndex?: number) => void
  /** Opens sliding-window visualization for a variable. */
  onOpenSlidingWindow: (variableName: string, stepIndex?: number) => void
  /** Opens boolean array DP visualization for a variable. */
  onOpenBooleanArray: (variableName: string) => void
  /** Opens graph visualization for a variable. */
  onOpenGraph: (variableName: string) => void
  /** Opens matrix visualization for a variable. */
  onOpenMatrix: (variableName: string, stepIndex?: number) => void
  /** Opens tree graph visualization for a variable. */
  onOpenTreeGraph: (variableName: string) => void
  /** Opens list graph visualization for a variable. */
  onOpenListGraph: (variableName: string) => void
  /** Opens recursion tree visualization. */
  onOpenTree: () => void
}

export function VariablesCard({
  currentStep,
  variableEntries,
  expandedVariables,
  hasRecursion,
  isClassDesignTrace = false,
  primaryArrayName,
  primaryAreaArrayName,
  primaryAreaStepIndex,
  primaryBinarySearchArrayName,
  primaryBinarySearchStepIndex,
  primarySlidingWindowStringName,
  primarySlidingWindowStepIndex,
  primaryBooleanArrayName,
  primaryGraphName,
  primaryMatrixName,
  primaryMatrixStepIndex,
  primaryTreeNodeName,
  visualizableTreeNodeNames = [],
  primaryListNodeName,
  visualizableListNodeNames = [],
  onToggleVariable,
  onOpenStack,
  onOpenBarChart,
  onOpenArea,
  onOpenBinarySearch,
  onOpenSlidingWindow,
  onOpenBooleanArray,
  onOpenGraph,
  onOpenMatrix,
  onOpenTreeGraph,
  onOpenListGraph,
  onOpenTree,
}: VariablesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="space-y-1.5">
          <CardTitle>Variables</CardTitle>
          <CardDescription>Current variable states</CardDescription>
        </div>
        <div className="flex gap-2">
          {primaryArrayName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onOpenBarChart(primaryArrayName)}
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
                onOpenArea(primaryAreaArrayName, primaryAreaStepIndex)
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
                onOpenBinarySearch(
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
                onOpenSlidingWindow(
                  primarySlidingWindowStringName,
                  primarySlidingWindowStepIndex
                )
              }
            >
              <Search className="w-4 h-4" />
              Sliding Window View
            </Button>
          )}
          {primaryBooleanArrayName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onOpenBooleanArray(primaryBooleanArrayName)}
            >
              <CheckSquare className="w-4 h-4" />
              DP View
            </Button>
          )}
          {primaryGraphName && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onOpenGraph(primaryGraphName)}
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
              onClick={onOpenTree}
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
                onOpenMatrix(primaryMatrixName, primaryMatrixStepIndex)
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
              onClick={() => onOpenTreeGraph(primaryTreeNodeName)}
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
              onClick={() => onOpenListGraph(primaryListNodeName)}
            >
              <GitGraph className="w-4 h-4" />
              List Graph
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {currentStep && variableEntries.length > 0 ? (
          <Stack spacing="xs">
            {variableEntries.map(([name, value]) => (
              <VariableRow
                key={name}
                name={name}
                value={value}
                expandedVariables={expandedVariables}
                visualizableTreeNodeNames={visualizableTreeNodeNames}
                visualizableListNodeNames={visualizableListNodeNames}
                onToggleVariable={onToggleVariable}
                onOpenStack={onOpenStack}
                onOpenBarChart={onOpenBarChart}
                onOpenBooleanArray={onOpenBooleanArray}
                onOpenGraph={onOpenGraph}
                onOpenMatrix={onOpenMatrix}
                onOpenTreeGraph={onOpenTreeGraph}
                onOpenListGraph={onOpenListGraph}
              />
            ))}
          </Stack>
        ) : (
          <p className="text-sm text-muted-foreground">
            No variables to display
          </p>
        )}
      </CardContent>
    </Card>
  )
}
