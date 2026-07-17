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
import { isUndefined } from '@/shared/lib/guards'
import { VariableRow } from './variable-row'
import type { OpenVisualization } from '../model/types'

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
  /** First step containing a prepared min/max heap pair. */
  primaryHeapStepIndex?: number
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
}

export function VariablesCard({
  currentStep,
  variableEntries,
  expandedVariables,
  hasRecursion,
  isClassDesignTrace = false,
  primaryHeapStepIndex,
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
}: VariablesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="space-y-1.5">
          <CardTitle>Variables</CardTitle>
          <CardDescription>Current variable states</CardDescription>
        </div>
        <div className="flex gap-2">
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
                onOpenVisualization={onOpenVisualization}
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
