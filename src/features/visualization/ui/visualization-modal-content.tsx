import type { ReactNode } from 'react'
import type { ExecutionState } from '@/entities/execution'
import { RETURN_VALUE_LABEL } from '@/entities/execution'
import {
  isGraphNodeShape,
  isListNodeShape,
  isTreeNodeShape,
} from '@/entities/data-structure'
import {
  isArray,
  isBooleanArray,
  isGraphSource,
  isMatrix,
  isNull,
  isNumericArray,
} from '@/shared/lib/guards'
import { safeStringify } from '@/shared/lib/safe-stringify'
import {
  getBinarySearchIndexState,
  isBinarySearchArrayCandidate,
} from '../lib/binary-search-view'
import { getAreaVisualizationState } from '../lib/area-view'
import { getSlidingWindowVisualizationState } from '../lib/sliding-window-view'
import { getRollingDpState, isRollingDpCandidate } from '../lib/rolling-dp-view'
import { getGraphNodeAdjacencyRecord } from '../lib/graph-view'
import { getMapVisualizationState } from '../lib/map-view'
import { getExecutionStepSearchOrder } from '../lib/execution-step-search'
import { getHeapVisualizationState } from '../lib/heap-view'
import { getWordLadderVisualizationState } from '../lib/word-ladder-view'
import { getExpressionVisualizationState } from '../lib/expression-view'
import { hasCallFrameMetadata } from '../lib/call-frame-inspector'
import type { VisualizationType } from '../model/types'
import { StackVisualizer } from './stack-visualizer'
import { RecursionTreeVisualizer } from './recursion-tree-visualizer'
import { BarChartVisualizer } from './bar-chart-visualizer'
import { AreaVisualizer } from './area-visualizer'
import { BinarySearchVisualizer } from './binary-search-visualizer'
import { SlidingWindowVisualizer } from './sliding-window-visualizer'
import { DpVisualizer } from './dp-visualizer'
import { GraphVisualizer } from './graph-visualizer'
import { MatrixVisualizer } from './matrix-visualizer'
import { MapVisualizer } from './map-visualizer'
import { TreeGraphVisualizer } from './tree-graph-visualizer'
import { ListGraphVisualizer } from './list-graph-visualizer'
import { HeapVisualizer } from './heap-visualizer'
import { WordLadderVisualizer } from './word-ladder-visualizer'
import { ExpressionVisualizer } from './expression-visualizer'
import { CallFrameInspector } from './call-frame-inspector'

type ExecutionStepSnapshot = ExecutionState['steps'][number]

type VisualizationContentProps = {
  /** Type of visualization content to render. */
  type: VisualizationType
  /** Variable name targeted by the selected visualization. */
  targetVariable?: string
  /** Step index to use when the target variable or pointers are not on the current step. */
  targetStepIndex?: number
  /** Full execution state used to search surrounding steps and read return values. */
  executionState: ExecutionState
  /** Currently selected execution step. */
  currentStep: ExecutionStepSnapshot | undefined
  /** Display name for tree graphs when visualizing the return value. */
  treeGraphDisplayName?: string
  /** Whether the tree modal represents class-design operation calls. */
  isClassDesignTrace?: boolean
}

function findNumericArrayStep({
  executionState,
  variableName,
  targetStepIndex,
}: {
  /** Execution state whose steps should be searched. */
  executionState: ExecutionState
  /** Numeric array variable name to find. */
  variableName: string
  /** Preferred step index to check before surrounding steps. */
  targetStepIndex?: number
}): ExecutionStepSnapshot | undefined {
  const orderedIndexes = getExecutionStepSearchOrder({
    executionState,
    targetStepIndex,
  })

  for (const index of orderedIndexes) {
    const step = executionState.steps[index]

    if (step && isNumericArray(step.variables[variableName])) {
      return step
    }
  }

  return undefined
}

function findArrayStep({
  executionState,
  variableName,
  targetStepIndex,
}: {
  /** Execution state whose steps should be searched. */
  executionState: ExecutionState
  /** Array variable name to find. */
  variableName: string
  /** Preferred step index to check before surrounding steps. */
  targetStepIndex?: number
}): ExecutionStepSnapshot | undefined {
  const orderedIndexes = getExecutionStepSearchOrder({
    executionState,
    targetStepIndex,
    preferPastSteps: true,
    includeFutureSteps: false,
  })

  for (const index of orderedIndexes) {
    const step = executionState.steps[index]

    if (step && isArray(step.variables[variableName])) {
      return step
    }
  }

  return undefined
}

function findTreeNodeStep({
  executionState,
  variableName,
}: {
  /** Execution state whose steps should be searched. */
  executionState: ExecutionState
  /** Tree node variable name to find. */
  variableName: string
}): ExecutionStepSnapshot | undefined {
  const orderedIndexes = getExecutionStepSearchOrder({
    executionState,
    preferPastSteps: true,
  })

  for (const index of orderedIndexes) {
    const step = executionState.steps[index]

    if (step && isTreeNodeShape(step.variables[variableName])) {
      return step
    }
  }

  return undefined
}

function NumericArrayError({
  targetVariable,
  data,
}: {
  /** Variable name that failed numeric array validation. */
  targetVariable: string
  /** Runtime value that could not be rendered as a numeric array. */
  data: unknown
}) {
  return (
    <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
      <p className="font-semibold">Unable to visualize "{targetVariable}"</p>
      <p>Expected a numeric array, but got:</p>
      <pre className="mt-2 text-xs bg-white/50 p-2 rounded">
        {safeStringify(data, 2)}
      </pre>
    </div>
  )
}

export function VisualizationModalContent({
  type,
  targetVariable,
  targetStepIndex,
  executionState,
  currentStep,
  treeGraphDisplayName,
  isClassDesignTrace = false,
}: VisualizationContentProps): ReactNode {
  const getCurrentStepVariable = (name: string) => currentStep?.variables[name]

  if (type === 'tree') {
    if (!isClassDesignTrace && hasCallFrameMetadata(executionState)) {
      return <CallFrameInspector executionState={executionState} />
    }

    return <RecursionTreeVisualizer state={executionState} />
  }

  if (type === 'heap') {
    const heapState = getHeapVisualizationState(executionState, targetStepIndex)

    return heapState ? (
      <HeapVisualizer state={heapState} />
    ) : (
      <div>Prepared heap state is not available at this step.</div>
    )
  }

  if (type === 'word-ladder') {
    const wordLadderState = getWordLadderVisualizationState(
      executionState,
      targetStepIndex
    )

    return wordLadderState ? (
      <WordLadderVisualizer state={wordLadderState} />
    ) : (
      <div>Word Ladder state is not available at this step.</div>
    )
  }

  if (type === 'expression') {
    const expressionState = getExpressionVisualizationState(
      executionState,
      targetStepIndex
    )

    return expressionState ? (
      <ExpressionVisualizer state={expressionState} />
    ) : (
      <div>Expression state is not available at this step.</div>
    )
  }

  if (!targetVariable) {
    return null
  }

  switch (type) {
    case 'stack': {
      const data = findArrayStep({
        executionState,
        variableName: targetVariable,
        targetStepIndex,
      })?.variables[targetVariable]

      return isArray(data) ? (
        <StackVisualizer data={data} name={targetVariable} />
      ) : (
        <div>Variable is not an array</div>
      )
    }

    case 'bar-chart': {
      const data =
        findNumericArrayStep({
          executionState,
          variableName: targetVariable,
          targetStepIndex,
        })?.variables[targetVariable] ?? getCurrentStepVariable(targetVariable)

      if (!isNumericArray(data)) {
        return <NumericArrayError targetVariable={targetVariable} data={data} />
      }

      return (
        <BarChartVisualizer
          data={data.map((value) => Number(value))}
          name={targetVariable}
        />
      )
    }

    case 'area': {
      const visualizationState = getAreaVisualizationState({
        executionState,
        variableName: targetVariable,
        targetStepIndex,
      })

      return visualizationState ? (
        <AreaVisualizer
          data={visualizationState.data}
          name={targetVariable}
          areaState={visualizationState.areaState}
        />
      ) : (
        <div>Area pointers are not available.</div>
      )
    }

    case 'binary-search': {
      const fallbackStep =
        executionState.steps[targetStepIndex ?? executionState.currentStep]
      const currentStepData = currentStep?.variables[targetVariable]
      const binarySearchStep =
        currentStep &&
        isBinarySearchArrayCandidate(
          targetVariable,
          currentStepData,
          currentStep.variables
        )
          ? currentStep
          : fallbackStep
      const data = binarySearchStep?.variables[targetVariable]
      const indexState = getBinarySearchIndexState(
        binarySearchStep?.variables ?? {}
      )

      return isNumericArray(data) && indexState ? (
        <BinarySearchVisualizer
          data={data.map((value) => Number(value))}
          name={targetVariable}
          indexState={indexState}
        />
      ) : (
        <div>Binary search indexes are not available.</div>
      )
    }

    case 'sliding-window': {
      const visualizationState = getSlidingWindowVisualizationState({
        executionState,
        variableName: targetVariable,
        targetStepIndex,
      })

      return visualizationState ? (
        <SlidingWindowVisualizer
          data={visualizationState.data}
          name={targetVariable}
          windowState={visualizationState.windowState}
        />
      ) : (
        <div>Sliding window indexes are not available.</div>
      )
    }

    case 'dp': {
      const data = getCurrentStepVariable(targetVariable)
      const rollingDpStep = getExecutionStepSearchOrder({
        executionState,
        targetStepIndex,
      })
        .map((index) => executionState.steps[index])
        .find(
          (step) =>
            step &&
            isRollingDpCandidate(
              targetVariable,
              step.variables[targetVariable],
              step.variables
            )
        )
      const rollingDpState = rollingDpStep
        ? getRollingDpState(rollingDpStep.variables)
        : null

      if (rollingDpState) {
        return (
          <DpVisualizer
            data={rollingDpState.values}
            name={targetVariable}
            labels={rollingDpState.labels}
            labelHeader="state"
            tableKind="rolling DP state"
            description="prev2 and prev1 carry the best totals from the previous two positions."
          />
        )
      }

      const dpData = isBooleanArray(data)
        ? data
        : isNumericArray(data)
          ? data.map(Number)
          : null

      return dpData ? (
        <DpVisualizer data={dpData} name={targetVariable} />
      ) : (
        <div>Variable is not a boolean or numeric DP array</div>
      )
    }

    case 'map': {
      const mapState = getExecutionStepSearchOrder({
        executionState,
        targetStepIndex,
      })
        .map((index) => executionState.steps[index])
        .map((step) =>
          step
            ? getMapVisualizationState(
                targetVariable,
                step.variables[targetVariable],
                step.variables
              )
            : null
        )
        .find((state) => !isNull(state))

      return mapState ? (
        <MapVisualizer state={mapState} />
      ) : (
        <div>Map lookup context is not available.</div>
      )
    }

    case 'tree-graph': {
      const shouldShowReturnTree =
        targetVariable === RETURN_VALUE_LABEL &&
        isTreeNodeShape(executionState.returnValue)
      const data = shouldShowReturnTree
        ? executionState.returnValue
        : findTreeNodeStep({
            executionState,
            variableName: targetVariable,
          })?.variables[targetVariable]
      const treeName = treeGraphDisplayName ?? targetVariable

      return isTreeNodeShape(data) ? (
        <TreeGraphVisualizer
          data={data}
          name={treeName}
          state={executionState}
        />
      ) : (
        <div>Variable is not a binary tree node</div>
      )
    }

    case 'list-graph': {
      const data = getCurrentStepVariable(targetVariable)

      return isNull(data) || isListNodeShape(data) ? (
        <ListGraphVisualizer data={data} name={targetVariable} />
      ) : (
        <div>Variable is not a linked list node</div>
      )
    }

    case 'graph': {
      const rawData =
        targetVariable === RETURN_VALUE_LABEL
          ? executionState.returnValue
          : getCurrentStepVariable(targetVariable)
      const data = isGraphNodeShape(rawData)
        ? getGraphNodeAdjacencyRecord(rawData)
        : rawData
      const stateVarName = Object.keys(currentStep?.variables || {}).find(
        (name) =>
          name.toLowerCase() === 'state' || name.toLowerCase().includes('vis')
      )
      const nodeStates = stateVarName
        ? currentStep?.variables[stateVarName]
        : undefined

      return isGraphSource(data) ? (
        <GraphVisualizer
          data={data}
          name={targetVariable}
          nodeStates={isArray(nodeStates) ? nodeStates : undefined}
        />
      ) : (
        <div>Variable is not a graph structure</div>
      )
    }

    case 'matrix': {
      const currentStepData =
        executionState.steps[executionState.currentStep]?.variables[
          targetVariable
        ]
      const matrixStepIndex = isMatrix(currentStepData)
        ? executionState.currentStep
        : (targetStepIndex ?? executionState.currentStep)
      const matrixStep = executionState.steps[matrixStepIndex]
      const data = matrixStep?.variables[targetVariable]
      const previousStep =
        matrixStepIndex > 0 ? executionState.steps[matrixStepIndex - 1] : null
      const previousData = previousStep?.variables[targetVariable]

      return isMatrix(data) ? (
        <MatrixVisualizer
          data={data}
          previousData={previousData}
          name={targetVariable}
        />
      ) : (
        <div>Variable is not a matrix (2D array)</div>
      )
    }

    case null:
      return null
  }
}
