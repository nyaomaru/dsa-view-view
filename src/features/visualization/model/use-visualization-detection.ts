import { useMemo } from 'react'
import type { ExecutionState, ExecutionStep } from '@/entities/execution'
import { RETURN_VALUE_LABEL } from '@/entities/execution'
import {
  isListNodeShape,
  isTreeNodeShape,
  type TreeNodeValue,
} from '@/entities/data-structure'
import {
  isArray,
  isBooleanArray,
  isMatrix,
  isNumericArray,
  isObject,
} from '@/shared/lib/guards'
import { VISUALIZATION_CONSTANTS } from '../constants/constants'
import {
  getMatrixSignature,
  getNumericArraySignature,
  getTreeNodeSignature,
} from '../lib/value-formatting'
import { isBinarySearchArrayCandidate } from '../lib/binary-search-view'
import { isAreaViewCandidate } from '../lib/area-view'
import { isSlidingWindowCandidate } from '../lib/sliding-window-view'
import { isAdjacencyListCandidate } from '../lib/graph-view'

const { RECURSION_DEPTH_THRESHOLD } = VISUALIZATION_CONSTANTS
const CLASS_DESIGN_INPUT_VARIABLE = '__algorithmVisualizerClassDesignInput'
const RESULT_VARIABLE_NAME = 'result'
const WORKING_PATH_VARIABLE_NAMES = new Set(['path'])
const SORT_TRACE_KEYWORDS = ['sort', 'sorted', 'swap', 'partition', 'pivot']
const TRAVERSAL_WORKLIST_NAMES = new Set([
  'deque',
  'frontier',
  'q',
  'queue',
  'stack',
])

type VisualizationDetection = {
  /** Currently selected execution step. */
  currentStep: ExecutionState['steps'][number] | undefined
  /** Visualizable variable entries from the current step. */
  variableEntries: [string, unknown][]
  /** Whether the execution trace contains recursive call depth. */
  hasRecursion: boolean
  /** Whether the trace represents class-design operation calls. */
  isClassDesignTrace: boolean
  /** Primary result-like array to show as a stack. */
  primaryStackName: string | undefined
  /** Primary numeric array to show as a bar chart. */
  primaryArrayName: string | undefined
  /** Primary numeric array to show in container-area view. */
  primaryAreaArrayName: string | undefined
  /** Step index where area pointers are available. */
  primaryAreaStepIndex: number | undefined
  /** Primary numeric array to show in binary-search index view. */
  primaryBinarySearchArrayName: string | undefined
  /** Step index where binary-search indexes are available. */
  primaryBinarySearchStepIndex: number | undefined
  /** Primary string to show in sliding-window view. */
  primarySlidingWindowStringName: string | undefined
  /** Step index where sliding-window pointers are available. */
  primarySlidingWindowStepIndex: number | undefined
  /** Primary boolean array to show in DP view. */
  primaryBooleanArrayName: string | undefined
  /** Primary adjacency-list graph variable. */
  primaryGraphName: string | undefined
  /** Primary matrix variable. */
  primaryMatrixName: string | undefined
  /** Step index where the primary matrix is first available. */
  primaryMatrixStepIndex: number | undefined
  /** Primary tree node variable. */
  primaryTreeNodeName: string | undefined
  /** Tree node variable names available for inline tree graph actions. */
  visualizableTreeNodeNames: string[]
  /** Primary linked-list node variable. */
  primaryListNodeName: string | undefined
  /** Linked-list variable names that remain visualizable when currently null. */
  visualizableListNodeNames: string[]
}

type InitialVariableContext = {
  /** Step number where initial variables first appear. */
  initialVariableStepNumber: number
  /** Variable names present in the initial variable snapshot. */
  initialVariableNames: Set<string>
}

type VisualizationMutationMetadata = {
  /** Numeric array names whose value changed during execution. */
  mutatedNumericArrayNames: Set<string>
  /** Boolean array names whose value changed during execution. */
  mutatedBooleanArrayNames: Set<string>
  /** Matrix names whose value changed during execution. */
  mutatedMatrixNames: Set<string>
  /** Tree node names whose structure changed during execution. */
  mutatedTreeNodeNames: Set<string>
  /** First step number where each matrix variable appears. */
  firstMatrixStepByName: Map<string, number>
}

type VariableEntries = [string, unknown][]
type SignatureReader = (value: unknown) => string | null
type NamedLengthCandidate = {
  /** Candidate variable name. */
  name?: string
  /** Candidate data-structure length. */
  length: number
}

function isClassDesignExecution(executionState: ExecutionState): boolean {
  return executionState.steps.some((step) =>
    step.description.includes(CLASS_DESIGN_INPUT_VARIABLE)
  )
}

function hasRecursiveCallStack(executionState: ExecutionState): boolean {
  return executionState.steps.some(
    (step) => (step.callStack?.length ?? 0) > RECURSION_DEPTH_THRESHOLD
  )
}

function hasSortTrace(executionState: ExecutionState): boolean {
  return executionState.steps.some((step) => {
    const traceText = [step.description, ...(step.callStack ?? [])]
      .join(' ')
      .toLowerCase()

    return SORT_TRACE_KEYWORDS.some((keyword) => traceText.includes(keyword))
  })
}

function getListNodeLength(value: unknown): number {
  if (!isListNodeShape(value)) return 0

  const seen = new WeakSet<object>()
  let current: unknown = value
  let length = 0

  while (isObject(current) && isListNodeShape(current)) {
    if (seen.has(current)) break

    seen.add(current)
    length += 1
    current = current.next
  }

  return length
}

function getBooleanArraySignature(value: unknown): string | null {
  return isBooleanArray(value) ? JSON.stringify(value) : null
}

function getPrimaryListNodeName(
  variableEntries: [string, unknown][]
): string | undefined {
  const bestListNode = variableEntries.reduce<NamedLengthCandidate>(
    (best, [name, value]) => {
      const length = getListNodeLength(value)

      return length > best.length ? { name, length } : best
    },
    { length: 0 }
  )

  return bestListNode.name
}

function getVisualizableListNodeNames(
  executionState: ExecutionState
): string[] {
  const currentStepNumber =
    executionState.steps[executionState.currentStep]?.stepNumber ?? -1
  const names = new Set<string>()

  executionState.steps.forEach((step) => {
    if (step.stepNumber > currentStepNumber) return

    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      if (isListNodeShape(value)) {
        names.add(name)
      }
    })
  })

  return [...names]
}

function isConstantLikeName(name: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(name)
}

function isTraversalWorklistName(name: string): boolean {
  return TRAVERSAL_WORKLIST_NAMES.has(name.toLowerCase())
}

function isWorkingPathName(name: string): boolean {
  return WORKING_PATH_VARIABLE_NAMES.has(name.toLowerCase())
}

function isVisualizableVariableName(name: string): boolean {
  return name !== RETURN_VALUE_LABEL
}

function getVisualizableVariableEntries(
  variables: ExecutionStep['variables']
): VariableEntries {
  return Object.entries(variables).filter(([name]) =>
    isVisualizableVariableName(name)
  )
}

function getInitialVariableContext(
  executionState: ExecutionState
): InitialVariableContext {
  const initialVariablesStep = executionState.steps.find(
    (step) => Object.keys(step.variables).length > 0
  )
  return {
    initialVariableStepNumber: initialVariablesStep?.stepNumber ?? -1,
    initialVariableNames: new Set(
      getVisualizableVariableEntries(initialVariablesStep?.variables ?? {}).map(
        ([name]) => name
      )
    ),
  }
}

function didSignatureChange(
  nextSignature: string | null,
  previousSignature: string | null
): boolean {
  return (
    nextSignature !== null &&
    previousSignature !== null &&
    nextSignature !== previousSignature
  )
}

function trackSignatureMutation({
  name,
  nextValue,
  previousValue,
  readSignature,
  mutatedNames,
}: {
  name: string
  nextValue: unknown
  previousValue: unknown
  readSignature: SignatureReader
  mutatedNames: Set<string>
}): void {
  if (
    didSignatureChange(readSignature(nextValue), readSignature(previousValue))
  ) {
    mutatedNames.add(name)
  }
}

function collectVisualizationMutationMetadata(
  executionState: ExecutionState
): VisualizationMutationMetadata {
  const metadata: VisualizationMutationMetadata = {
    mutatedNumericArrayNames: new Set<string>(),
    mutatedBooleanArrayNames: new Set<string>(),
    mutatedMatrixNames: new Set<string>(),
    mutatedTreeNodeNames: new Set<string>(),
    firstMatrixStepByName: new Map<string, number>(),
  }

  executionState.steps.forEach((step) => {
    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      if (isMatrix(value) && !metadata.firstMatrixStepByName.has(name)) {
        metadata.firstMatrixStepByName.set(name, step.stepNumber)
      }
    })
  })

  for (let index = 1; index < executionState.steps.length; index += 1) {
    const previousVariables = executionState.steps[index - 1]?.variables ?? {}
    const nextVariables = executionState.steps[index]?.variables ?? {}

    for (const [name, nextValue] of getVisualizableVariableEntries(
      nextVariables
    )) {
      const previousValue = previousVariables[name]

      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getNumericArraySignature,
        mutatedNames: metadata.mutatedNumericArrayNames,
      })
      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getBooleanArraySignature,
        mutatedNames: metadata.mutatedBooleanArrayNames,
      })
      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getMatrixSignature,
        mutatedNames: metadata.mutatedMatrixNames,
      })
      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getTreeNodeSignature,
        mutatedNames: metadata.mutatedTreeNodeNames,
      })
    }
  }

  return metadata
}

function shouldTrackMatrixName(
  name: string,
  mutatedMatrixNames: Set<string>
): boolean {
  return name !== RESULT_VARIABLE_NAME || mutatedMatrixNames.has(name)
}

function collectMatrixCandidateNames(
  executionState: ExecutionState,
  mutatedMatrixNames: Set<string>,
  initialVariableNames: Set<string>
): string[] {
  const matrixNames = new Set<string>()

  executionState.steps.forEach((step) => {
    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      if (
        shouldTrackMatrixName(name, mutatedMatrixNames) &&
        isMatrix(value) &&
        !isAdjacencyListCandidate(name, value) &&
        (!initialVariableNames.has(name) || mutatedMatrixNames.has(name))
      ) {
        matrixNames.add(name)
      }
    })
  })

  return [...matrixNames]
}

function scoreMatrixCandidate({
  name,
  metadata,
  initialVariableStepNumber,
}: {
  name: string
  metadata: VisualizationMutationMetadata
  initialVariableStepNumber: number
}): number {
  const firstMatrixStep =
    metadata.firstMatrixStepByName.get(name) ?? initialVariableStepNumber
  const isDerivedMatrix = firstMatrixStep > initialVariableStepNumber

  return (
    (metadata.mutatedMatrixNames.has(name) ? 4 : 0) +
    (isDerivedMatrix ? 2 : 0) -
    (isConstantLikeName(name) ? 3 : 0) -
    (isTraversalWorklistName(name) ? 3 : 0)
  )
}

function getPrimaryMatrixName(
  executionState: ExecutionState,
  metadata: VisualizationMutationMetadata,
  initialVariableStepNumber: number,
  initialVariableNames: Set<string>
): string | undefined {
  return collectMatrixCandidateNames(
    executionState,
    metadata.mutatedMatrixNames,
    initialVariableNames
  )
    .map((name) => ({
      name,
      score: scoreMatrixCandidate({
        name,
        metadata,
        initialVariableStepNumber,
      }),
    }))
    .sort((left, right) => right.score - left.score)[0]?.name
}

function getPrimaryMatrixStepIndex(
  executionState: ExecutionState,
  primaryMatrixName: string | undefined
): number | undefined {
  if (primaryMatrixName === undefined) return undefined

  const primaryMatrixStepIndex = executionState.steps.findIndex((step) =>
    isMatrix(step.variables[primaryMatrixName])
  )

  return primaryMatrixStepIndex >= 0 ? primaryMatrixStepIndex : undefined
}

function getPrimaryArrayName(
  variableEntries: VariableEntries,
  mutatedNumericArrayNames: Set<string>,
  options: { excludeResultLikeArrays?: boolean } = {}
): string | undefined {
  return variableEntries
    .filter(
      ([name, value]) =>
        (!options.excludeResultLikeArrays || !isResultLikeName(name)) &&
        !isWorkingPathName(name) &&
        isNumericArray(value) &&
        value.length > 0 &&
        mutatedNumericArrayNames.has(name)
    )
    .sort(([leftName], [rightName]) => {
      const leftIsResultLike =
        leftName.toLowerCase() === 'res' || leftName.toLowerCase() === 'result'
      const rightIsResultLike =
        rightName.toLowerCase() === 'res' ||
        rightName.toLowerCase() === 'result'

      if (leftIsResultLike && !rightIsResultLike) return -1
      if (!leftIsResultLike && rightIsResultLike) return 1

      return 0
    })[0]?.[0]
}

function isResultLikeName(name: string): boolean {
  const lowerName = name.toLowerCase()

  return lowerName === 'res' || lowerName === 'result'
}

function getPrimaryStackName(
  variableEntries: VariableEntries,
  options: { includeNumericResultArrays?: boolean } = {}
): string | undefined {
  return variableEntries.find(
    ([name, value]) =>
      isResultLikeName(name) &&
      isArray(value) &&
      value.length > 0 &&
      (options.includeNumericResultArrays || !isNumericArray(value))
  )?.[0]
}

function hasInitialTreeNodeVariable(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>
): boolean {
  return variableEntries.some(
    ([name, value]) => initialVariableNames.has(name) && isTreeNodeShape(value)
  )
}

function getPrimaryBinarySearchArrayName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): string | undefined {
  const stepIndexes = [
    ...Array.from({ length: executionState.currentStep + 1 }, (_, index) =>
      Math.max(0, executionState.currentStep - index)
    ),
    ...Array.from(
      { length: executionState.steps.length - executionState.currentStep - 1 },
      (_, index) => executionState.currentStep + index + 1
    ),
  ]

  for (const index of stepIndexes) {
    const step = executionState.steps[index]
    if (!step) continue

    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) =>
        initialVariableNames.has(name) &&
        isBinarySearchArrayCandidate(name, value, step.variables)
    )?.[0]

    if (candidate) return candidate
  }

  return undefined
}

function getPrimaryBinarySearchStepIndex(
  executionState: ExecutionState,
  primaryBinarySearchArrayName: string | undefined
): number | undefined {
  if (!primaryBinarySearchArrayName) return undefined

  const stepIndexes = [
    ...Array.from({ length: executionState.currentStep + 1 }, (_, index) =>
      Math.max(0, executionState.currentStep - index)
    ),
    ...Array.from(
      { length: executionState.steps.length - executionState.currentStep - 1 },
      (_, index) => executionState.currentStep + index + 1
    ),
  ]

  for (const index of stepIndexes) {
    const step = executionState.steps[index]
    if (
      step &&
      isBinarySearchArrayCandidate(
        primaryBinarySearchArrayName,
        step.variables[primaryBinarySearchArrayName],
        step.variables
      )
    ) {
      return index
    }
  }

  return undefined
}

function getPrimaryAreaArrayName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>
): string | undefined {
  for (const step of executionState.steps) {
    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) =>
        initialVariableNames.has(name) &&
        isAreaViewCandidate(name, value, step.variables)
    )?.[0]

    if (candidate) return candidate
  }

  return undefined
}

function getPrimaryAreaStepIndex(
  executionState: ExecutionState,
  primaryAreaArrayName: string | undefined
): number | undefined {
  if (!primaryAreaArrayName) return undefined

  const primaryAreaStepIndex = executionState.steps.findIndex((step) =>
    isAreaViewCandidate(
      primaryAreaArrayName,
      step.variables[primaryAreaArrayName],
      step.variables
    )
  )

  return primaryAreaStepIndex >= 0 ? primaryAreaStepIndex : undefined
}

function getPrimarySlidingWindowStringName(
  executionState: ExecutionState
): string | undefined {
  const stepIndexes = [
    ...Array.from({ length: executionState.currentStep + 1 }, (_, index) =>
      Math.max(0, executionState.currentStep - index)
    ),
    ...Array.from(
      { length: executionState.steps.length - executionState.currentStep - 1 },
      (_, index) => executionState.currentStep + index + 1
    ),
  ]

  for (const index of stepIndexes) {
    const step = executionState.steps[index]
    if (!step) continue

    const candidate = getVisualizableVariableEntries(step.variables).find(
      ([name, value]) => isSlidingWindowCandidate(name, value, step.variables)
    )?.[0]

    if (candidate) return candidate
  }

  return undefined
}

function getPrimarySlidingWindowStepIndex(
  executionState: ExecutionState,
  primarySlidingWindowStringName: string | undefined
): number | undefined {
  if (!primarySlidingWindowStringName) return undefined

  const primarySlidingWindowStepIndex = executionState.steps.findIndex((step) =>
    isSlidingWindowCandidate(
      primarySlidingWindowStringName,
      step.variables[primarySlidingWindowStringName],
      step.variables
    )
  )

  return primarySlidingWindowStepIndex >= 0
    ? primarySlidingWindowStepIndex
    : undefined
}

function getPrimaryBooleanArrayName(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>,
  mutatedBooleanArrayNames: Set<string>
): string | undefined {
  return variableEntries
    .filter(
      ([name, value]) =>
        name !== RESULT_VARIABLE_NAME &&
        isBooleanArray(value) &&
        value.length > 0 &&
        mutatedBooleanArrayNames.has(name)
    )
    .sort(([leftName], [rightName]) => {
      if (leftName.toLowerCase() === 'dp') return -1
      if (rightName.toLowerCase() === 'dp') return 1

      const leftIsDerived = initialVariableNames.has(leftName) ? 1 : 0
      const rightIsDerived = initialVariableNames.has(rightName) ? 1 : 0

      return leftIsDerived - rightIsDerived
    })[0]?.[0]
}

function getPrimaryGraphName(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>
): string | undefined {
  return variableEntries
    .filter(
      ([name, value]) =>
        name !== RESULT_VARIABLE_NAME &&
        isAdjacencyListCandidate(name, value) &&
        value.length > 0
    )
    .sort(([leftName], [rightName]) => {
      const leftLowerName = leftName.toLowerCase()
      const rightLowerName = rightName.toLowerCase()
      const leftIsGraphLike =
        leftLowerName === 'graph' ||
        leftLowerName === 'adj' ||
        leftLowerName === 'adjacency'
      const rightIsGraphLike =
        rightLowerName === 'graph' ||
        rightLowerName === 'adj' ||
        rightLowerName === 'adjacency'

      if (leftIsGraphLike && !rightIsGraphLike) return -1
      if (!leftIsGraphLike && rightIsGraphLike) return 1

      const leftIsDerived = initialVariableNames.has(leftName) ? 1 : 0
      const rightIsDerived = initialVariableNames.has(rightName) ? 1 : 0

      return leftIsDerived - rightIsDerived
    })[0]?.[0]
}

function getPrimaryTreeNodeName(
  variableEntries: VariableEntries,
  initialVariableNames: Set<string>,
  mutatedTreeNodeNames: Set<string>
): string | undefined {
  const initialTreeEntries = variableEntries.filter(
    ([name, value]) => isTreeNodeShape(value) && initialVariableNames.has(name)
  ) as [string, TreeNodeValue][]
  const mutatedTreeName = initialTreeEntries.find(([name]) =>
    mutatedTreeNodeNames.has(name)
  )?.[0]

  if (mutatedTreeName) return mutatedTreeName

  return initialTreeEntries
    .filter(([, root]) =>
      initialTreeEntries.some(
        ([, target]) => target !== root && treeContainsNode(root, target)
      )
    )
    .sort(
      (left, right) => countTreeNodes(right[1]) - countTreeNodes(left[1])
    )[0]?.[0]
}

function getPrimaryConstructedTreeNodeName(
  executionState: ExecutionState,
  initialVariableNames: Set<string>,
  mutatedTreeNodeNames: Set<string>
): string | undefined {
  if (!isTreeNodeShape(executionState.returnValue)) return undefined

  const candidateNames = new Set<string>()

  executionState.steps.forEach((step) => {
    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      const lowerName = name.toLowerCase()

      if (
        isTreeNodeShape(value) &&
        !initialVariableNames.has(name) &&
        (mutatedTreeNodeNames.has(name) ||
          lowerName === 'root' ||
          lowerName === 'result')
      ) {
        candidateNames.add(name)
      }
    })
  })

  return [...candidateNames].sort((left, right) => {
    if (left.toLowerCase() === 'root') return -1
    if (right.toLowerCase() === 'root') return 1

    return left.localeCompare(right)
  })[0]
}

function treeContainsNode(root: TreeNodeValue, target: TreeNodeValue): boolean {
  const pending = [root]
  const seen = new WeakSet<object>()

  while (pending.length > 0) {
    const node = pending.pop()
    if (!node || seen.has(node)) continue
    if (node === target) return true

    seen.add(node)
    if (node.left) pending.push(node.left)
    if (node.right) pending.push(node.right)
  }

  return false
}

function countTreeNodes(root: TreeNodeValue): number {
  const pending = [root]
  const seen = new WeakSet<object>()
  let count = 0

  while (pending.length > 0) {
    const node = pending.pop()
    if (!node || seen.has(node)) continue

    seen.add(node)
    count += 1
    if (node.left) pending.push(node.left)
    if (node.right) pending.push(node.right)
  }

  return count
}

export function detectVisualizationState(
  executionState: ExecutionState
): VisualizationDetection {
  const currentStep = executionState.steps[executionState.currentStep]
  const variableEntries = currentStep
    ? getVisualizableVariableEntries(currentStep.variables)
    : []
  const hasRecursion = hasRecursiveCallStack(executionState)
  const isClassDesignTrace = isClassDesignExecution(executionState)
  const { initialVariableStepNumber, initialVariableNames } =
    getInitialVariableContext(executionState)
  const metadata = collectVisualizationMutationMetadata(executionState)
  const prefersResultStack =
    hasInitialTreeNodeVariable(variableEntries, initialVariableNames) &&
    variableEntries.some(
      ([name, value]) => isResultLikeName(name) && isNumericArray(value)
    )

  const primaryArrayName = getPrimaryArrayName(
    variableEntries,
    metadata.mutatedNumericArrayNames,
    { excludeResultLikeArrays: prefersResultStack }
  )
  const primaryStackName = getPrimaryStackName(variableEntries, {
    includeNumericResultArrays: prefersResultStack,
  })
  const primaryBinarySearchArrayName = getPrimaryBinarySearchArrayName(
    executionState,
    initialVariableNames
  )
  const primaryBinarySearchStepIndex = getPrimaryBinarySearchStepIndex(
    executionState,
    primaryBinarySearchArrayName
  )
  const primaryAreaArrayName = getPrimaryAreaArrayName(
    executionState,
    initialVariableNames
  )
  const primaryAreaStepIndex = getPrimaryAreaStepIndex(
    executionState,
    primaryAreaArrayName
  )
  const primarySlidingWindowStringName =
    getPrimarySlidingWindowStringName(executionState)
  const primarySlidingWindowStepIndex = getPrimarySlidingWindowStepIndex(
    executionState,
    primarySlidingWindowStringName
  )
  const primaryBooleanArrayName = getPrimaryBooleanArrayName(
    variableEntries,
    initialVariableNames,
    metadata.mutatedBooleanArrayNames
  )
  const primaryGraphName = getPrimaryGraphName(
    variableEntries,
    initialVariableNames
  )
  const primaryMatrixName = getPrimaryMatrixName(
    executionState,
    metadata,
    initialVariableStepNumber,
    initialVariableNames
  )
  const primaryMatrixStepIndex = getPrimaryMatrixStepIndex(
    executionState,
    primaryMatrixName
  )
  const primaryTreeNodeName =
    getPrimaryTreeNodeName(
      variableEntries,
      initialVariableNames,
      metadata.mutatedTreeNodeNames
    ) ??
    getPrimaryConstructedTreeNodeName(
      executionState,
      initialVariableNames,
      metadata.mutatedTreeNodeNames
    ) ??
    (isTreeNodeShape(executionState.returnValue)
      ? RETURN_VALUE_LABEL
      : undefined)
  const primaryListNodeName = getPrimaryListNodeName(variableEntries)
  const visualizableListNodeNames = getVisualizableListNodeNames(executionState)
  const visualizableTreeNodeNames = new Set(
    [...metadata.mutatedTreeNodeNames].filter((name) =>
      initialVariableNames.has(name)
    )
  )
  if (primaryTreeNodeName) visualizableTreeNodeNames.add(primaryTreeNodeName)

  return {
    currentStep,
    variableEntries,
    hasRecursion,
    isClassDesignTrace,
    primaryStackName,
    primaryArrayName: hasSortTrace(executionState)
      ? primaryArrayName
      : undefined,
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
    visualizableTreeNodeNames: [...visualizableTreeNodeNames],
    primaryListNodeName,
    visualizableListNodeNames,
  }
}

export function useVisualizationDetection(executionState: ExecutionState) {
  return useMemo(
    () => detectVisualizationState(executionState),
    [executionState]
  )
}
