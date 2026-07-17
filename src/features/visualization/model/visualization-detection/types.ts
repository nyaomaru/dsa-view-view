import type { ExecutionState } from '@/entities/execution'

export type VisualizationDetection = {
  /** Currently selected execution step. */
  currentStep: ExecutionState['steps'][number] | undefined
  /** Visualizable variable entries from the current step. */
  variableEntries: [string, unknown][]
  /** Whether the execution trace contains recursive call depth. */
  hasRecursion: boolean
  /** Whether the trace represents class-design operation calls. */
  isClassDesignTrace: boolean
  /** First step index containing both prepared MinHeap and MaxHeap state. */
  primaryHeapStepIndex: number | undefined
  /** First step index containing Word Ladder inputs. */
  primaryWordLadderStepIndex: number | undefined
  /** Primary result-like array to show as a stack. */
  primaryStackName: string | undefined
  /** Primary numeric array to show as a bar chart. */
  primaryArrayName: string | undefined
  /** Primary height source to show in area or rain-water view. */
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
  /** Primary boolean, numeric, or rolling state source for DP View. */
  primaryDpName: string | undefined
  /** Primary semantic Map variable to show in Map View. */
  primaryMapName: string | undefined
  /** Step index where Map View context is first available. */
  primaryMapStepIndex: number | undefined
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

export type InitialVariableContext = {
  /** Step number where initial variables first appear. */
  initialVariableStepNumber: number
  /** Variable names present in the initial variable snapshot. */
  initialVariableNames: Set<string>
}

export type VisualizationMutationMetadata = {
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

export type VariableEntries = [string, unknown][]
export type SignatureReader = (value: unknown) => string | null
export type NamedLengthCandidate = {
  /** Candidate variable name. */
  name?: string
  /** Candidate data-structure length. */
  length: number
}
