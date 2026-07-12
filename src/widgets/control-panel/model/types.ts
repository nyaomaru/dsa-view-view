import type { AppMode } from '@/shared/model'
import type {
  CompilationError,
  CompilationResult,
  FunctionSignature,
} from '@/entities/code'
import type { ExecutionState, InputValues } from '@/entities/execution'

export type AlgorithmExampleOption = {
  /** Stable example identifier. */
  id: string
  /** Human-readable example label. */
  label: string
  /** Optional category used for grouping and search. */
  category?: string
}

export type ControlPanelProps = {
  /** Active application mode. */
  mode: AppMode
  /** Latest compilation result, or null before compilation. */
  compilationResult: CompilationResult | null
  /** Current editor lint errors. */
  lintErrors: CompilationError[]
  /** Function or class signature available for input generation. */
  functionSignature: FunctionSignature | null
  /** Optional initial values used to prefill verification inputs. */
  defaultInputValues?: Record<string, unknown>
  /** Current execution state, or null before running. */
  executionState: ExecutionState | null
  /** Whether execution playback is currently running. */
  isRunning: boolean
  /** Current playback interval in milliseconds. */
  playbackInterval: number
  /** Example snippets available in the editor. */
  algorithmExamples: AlgorithmExampleOption[]
  /** Currently selected example id, or custom when edited manually. */
  selectedExampleId: string
  /** Current View View animation image source. */
  viewViewAnimationSrc: string | null
  /** Callback when the current View View animation image loads. */
  onViewViewAnimationLoad?: () => void
  /** Whether to render the View View monitor above the tabs. */
  showViewViewMonitor?: boolean
  /** Whether to automatically open the primary visualization after running. */
  autoOpenPrimaryVisualization?: boolean
  /** Callback when the active mode changes. */
  onModeChange: (mode: AppMode) => void
  /** Callback when an example is selected. */
  onExampleChange: (exampleId: string) => void
  /** Callback to compile the current source code. */
  onCompile: () => void
  /** Callback to execute code with converted input values. */
  onRunCode: (values: InputValues) => void
  /** Callback to preserve raw verification input values. */
  onVerificationInputChange: (values: Record<string, unknown>) => void
  /** Callback when playback interval changes. */
  onPlaybackIntervalChange: (interval: number) => void
  /** Callback to advance one execution step. */
  onStepForward: () => void
  /** Callback to move back one execution step. */
  onStepBackward: () => void
  /** Callback to run playback through all remaining steps. */
  onRunAll: () => void
  /** Callback to pause playback. */
  onPause: () => void
  /** Callback to reset playback to the first step. */
  onResetToStart: () => void
  /** Callback to jump to the final execution step. */
  onSkipToEnd: () => void
  /** Callback to jump to a specific zero-based execution step index. */
  onJumpToStep: (stepIndex: number) => void
}

export type EditorTabContentProps = Pick<
  ControlPanelProps,
  | 'algorithmExamples'
  | 'selectedExampleId'
  | 'lintErrors'
  | 'compilationResult'
  | 'onExampleChange'
  | 'onCompile'
>

export type VerificationTabContentProps = Pick<
  ControlPanelProps,
  | 'functionSignature'
  | 'defaultInputValues'
  | 'onRunCode'
  | 'onVerificationInputChange'
>

export type RuntimeTabContentProps = Pick<
  ControlPanelProps,
  | 'executionState'
  | 'isRunning'
  | 'playbackInterval'
  | 'autoOpenPrimaryVisualization'
  | 'onPlaybackIntervalChange'
  | 'onStepForward'
  | 'onStepBackward'
  | 'onRunAll'
  | 'onPause'
  | 'onResetToStart'
  | 'onSkipToEnd'
  | 'onJumpToStep'
>
