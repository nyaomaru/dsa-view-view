import { useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type ExecutionState } from '@/entities/execution'
import {
  FUNCTION_ARGUMENTS_LABEL,
  RETURN_LOCATION_LABEL,
  RETURN_VALUE_LABEL,
} from '@/entities/execution'
import { Card } from '@/shared/ui'
import { pxToRem } from '@/shared/lib/units'
import {
  isInstanceOf,
  isNonArrayObject,
  isUndefined,
} from '@/shared/lib/guards'
import { TREE_CONFIG } from '../constants/constants'
import { formatDisplayValue } from '../lib/display-value'

/**
 * Props for RecursionTreeVisualizer component
 */
type RecursionTreeVisualizerProps = {
  /** Current execution state */
  state: ExecutionState
}

/**
 * Represents a node in the recursion tree
 */
type TreeNode = {
  /** Unique identifier for the node */
  id: string
  /** Name of the function */
  name: string
  /** Child function calls */
  children: TreeNode[]
  /** Depth in the recursion tree */
  depth: number
  /** Step number when the function was entered */
  startTime: number
  /** Step number when the function returned */
  endTime?: number
  /** Return value as a string */
  returnValue?: string
  /** Source location/expression for the return step */
  returnDescription?: string
  /** Function arguments at call time */
  args?: Record<string, unknown>
  /** Reference to the parent node */
  parent?: TreeNode
}

const {
  INDENT_SIZE,
  CONNECTOR_OFFSET_X,
  CONNECTOR_OFFSET_Y,
  ANIMATION_OFFSET_X,
} = TREE_CONFIG

const formatValue = (value: unknown) =>
  formatDisplayValue(value, { quoteStrings: true })

const formatArgs = (args: Record<string, unknown> | undefined) => {
  if (!args) return ''

  const functionArgs = args[FUNCTION_ARGUMENTS_LABEL]
  const visibleArgs = isNonArrayObject(functionArgs) ? functionArgs : args

  return Object.entries(visibleArgs)
    .filter(
      ([key]) =>
        key !== RETURN_VALUE_LABEL &&
        key !== RETURN_LOCATION_LABEL &&
        key !== FUNCTION_ARGUMENTS_LABEL
    )
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(', ')
}

export function RecursionTreeVisualizer({
  state,
}: RecursionTreeVisualizerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Reconstruct tree from execution history
  const activeNodes = useMemo(() => {
    const stack: TreeNode[] = []
    const allNodes: TreeNode[] = []

    // Filter steps to find function calls/returns
    const steps = state.steps.slice(0, state.currentStep + 1)

    steps.forEach((step) => {
      if (step.type === 'function-entry') {
        const name = step.description.replace('Entering function: ', '')
        const newNode: TreeNode = {
          id: `${name}-${step.stepNumber}`,
          name,
          children: [],
          depth: stack.length,
          startTime: step.stepNumber,
          args: step.variables,
        }
        allNodes.push(newNode)

        if (stack.length > 0) {
          const parent = stack[stack.length - 1]
          newNode.parent = parent
          parent.children.push(newNode)
        }
        stack.push(newNode)
      } else if (step.type === 'return' && stack.length > 0) {
        // Find the node that is finishing
        const node = stack.pop()
        if (node) {
          node.endTime = step.stepNumber
          const returnValue = step.variables[RETURN_VALUE_LABEL]
          const returnLocation = step.variables[RETURN_LOCATION_LABEL]

          if (!isUndefined(returnValue)) {
            node.returnValue = formatValue(returnValue)
          }

          node.returnDescription = formatValue(
            returnLocation ?? step.description.replace(/^return /, '')
          )
        }
      }
    })

    // Show all nodes that have started (history)
    return allNodes
  }, [state.steps, state.currentStep])

  // Auto-scroll to bottom when nodes change
  useEffect(() => {
    const bottomElement = bottomRef.current
    if (activeNodes.length > 0 && bottomElement) {
      const scrollContainer = bottomElement.closest(
        '[data-tree-scroll-container]'
      )
      if (isInstanceOf(HTMLElement)(scrollContainer)) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
  }, [activeNodes.length])

  return (
    <div className="w-full flex flex-col gap-2 p-4 font-mono text-sm">
      <AnimatePresence>
        {activeNodes.map((node) => {
          const isCompleted = !!node.endTime
          const isActive = !node.endTime
          const argsText = formatArgs(node.args)

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -ANIMATION_OFFSET_X }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="relative flex min-w-0 items-center"
              style={{ marginLeft: pxToRem(node.depth * INDENT_SIZE) }}
            >
              {/* Connector line for children (L-shape) - simplistic approach */}
              {node.depth > 0 && (
                <div
                  className="absolute bg-primary/50"
                  style={{
                    left: `-${pxToRem(CONNECTOR_OFFSET_X)}`,
                    top: '50%',
                    width: pxToRem(CONNECTOR_OFFSET_X),
                    height: '0.0625rem',
                  }}
                />
              )}
              {node.depth > 0 && (
                <div
                  className="absolute bg-primary/50"
                  style={{
                    left: `-${pxToRem(CONNECTOR_OFFSET_X)}`,
                    top: `-${pxToRem(CONNECTOR_OFFSET_Y)}`,
                    bottom: '50%',
                    width: '0.0625rem',
                  }}
                />
              )}

              <Card className="w-full min-w-0 border-primary bg-background px-3 py-2 shadow-none transition-colors">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-semibold leading-tight text-primary">
                    {node.name}
                  </span>
                  {argsText && (
                    <span className="break-words text-xs leading-tight text-muted-foreground">
                      ({argsText})
                    </span>
                  )}
                  {isCompleted && node.returnDescription && (
                    <span className="break-words text-xs leading-tight text-muted-foreground">
                      from {node.returnDescription}
                      {node.returnValue ? `: ${node.returnValue}` : ''}
                    </span>
                  )}
                  {isActive && (
                    <span className="text-xs leading-tight text-primary">
                      active
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {activeNodes.length === 0 && (
        <div className="text-muted-foreground text-center italic">
          No active function calls.
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  )
}
