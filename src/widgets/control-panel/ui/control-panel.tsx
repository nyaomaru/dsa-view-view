import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Input,
  Label,
  Paragraph,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui'
import { CompilationPanel } from '@/features/compilation'
import type { AppMode } from '@/shared/model'
import type {
  CompilationError,
  CompilationResult,
  FunctionSignature,
} from '@/entities/code'
import type { ExecutionState, InputValues } from '@/entities/execution'
import { ViewViewMonitor } from '@/features/visualization'
import { ChevronDown } from 'lucide-react'

type AlgorithmExampleOption = {
  /** Stable example identifier. */
  id: string
  /** Human-readable example label. */
  label: string
  /** Optional category used for grouping and search. */
  category?: string
}

type SearchableExample = {
  /** Source example option. */
  example: AlgorithmExampleOption
  /** Normalized search tokens for matching. */
  tokens: string[]
  /** Full normalized searchable text. */
  searchableText: string
  /** Initial letters for token-initial matching. */
  tokenInitials: string
  /** First characters present in the search tokens. */
  firstChars: Set<string>
}

type ExampleSearchIndex = {
  /** Searchable examples in display order. */
  entries: SearchableExample[]
  /** Searchable examples grouped by first token character. */
  byFirstChar: Map<string, SearchableExample[]>
}

const Controls = lazy(() =>
  import('@/features/code-execution/controls').then((module) => ({
    default: module.Controls,
  }))
)
const InputForm = lazy(() =>
  import('@/features/code-execution/input-form').then((module) => ({
    default: module.InputForm,
  }))
)
const Visualizer = lazy(() =>
  import('@/features/visualization/visualizer').then((module) => ({
    default: module.Visualizer,
  }))
)

/**
 * Props for ControlPanel component.
 */
type ControlPanelProps = {
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

type EditorTabContentProps = Pick<
  ControlPanelProps,
  | 'algorithmExamples'
  | 'selectedExampleId'
  | 'lintErrors'
  | 'compilationResult'
  | 'onExampleChange'
  | 'onCompile'
>

type VerificationTabContentProps = Pick<
  ControlPanelProps,
  | 'functionSignature'
  | 'defaultInputValues'
  | 'onRunCode'
  | 'onVerificationInputChange'
>

type RuntimeTabContentProps = Pick<
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

const DEFAULT_EXAMPLE_CATEGORY = 'Other'
const NO_FUZZY_MATCH_INDEX = -1
const EMPTY_QUERY_SCORE = 1
const ADJACENT_FUZZY_MATCH_SCORE = 3
const SPARSE_FUZZY_MATCH_SCORE = 1
const EXACT_TOKEN_MATCH_SCORE = 1_000
const TOKEN_INITIAL_MATCH_SCORE = 900
const TOKEN_PREFIX_MATCH_SCORE = 850
const TOKEN_SUBSTRING_MATCH_SCORE = 800
const FUZZY_TOKEN_MATCH_BASE_SCORE = 100
const NO_SEARCH_MATCH_SCORE = 0

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getSearchTokens(example: AlgorithmExampleOption): string[] {
  return [example.label, example.category, example.id]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => normalizeSearchText(value).split(' '))
    .filter(Boolean)
}

function createExampleSearchIndex(
  examples: AlgorithmExampleOption[]
): ExampleSearchIndex {
  const entries = examples.map((example) => {
    const tokens = getSearchTokens(example)
    return {
      example,
      tokens,
      searchableText: tokens.join(' '),
      tokenInitials: tokens.map((token) => token[0]).join(''),
      firstChars: new Set(tokens.map((token) => token[0])),
    }
  })
  const byFirstChar = new Map<string, SearchableExample[]>()

  entries.forEach((entry) => {
    entry.firstChars.forEach((firstChar) => {
      byFirstChar.set(firstChar, [...(byFirstChar.get(firstChar) ?? []), entry])
    })
  })

  return { entries, byFirstChar }
}

function getFuzzySubsequenceScore(text: string, query: string): number {
  let queryIndex = 0
  let score = NO_SEARCH_MATCH_SCORE
  let previousMatchIndex = NO_FUZZY_MATCH_INDEX

  for (let textIndex = 0; textIndex < text.length; textIndex++) {
    if (text[textIndex] !== query[queryIndex]) continue

    score +=
      previousMatchIndex === textIndex - 1
        ? ADJACENT_FUZZY_MATCH_SCORE
        : SPARSE_FUZZY_MATCH_SCORE
    previousMatchIndex = textIndex
    queryIndex++

    if (queryIndex === query.length) return score
  }

  return NO_SEARCH_MATCH_SCORE
}

function getExampleSearchScore(
  entry: SearchableExample,
  query: string
): number {
  if (!query) return EMPTY_QUERY_SCORE
  if (entry.tokenInitials.startsWith(query)) {
    return TOKEN_INITIAL_MATCH_SCORE - query.length
  }

  const terms = query.split(' ').filter(Boolean)
  let totalScore = NO_SEARCH_MATCH_SCORE

  for (const term of terms) {
    const termScore = Math.max(
      ...entry.tokens.map((token) => {
        if (token === term) return EXACT_TOKEN_MATCH_SCORE - term.length
        if (token.startsWith(term))
          return TOKEN_PREFIX_MATCH_SCORE - term.length
        if (token.includes(term)) {
          return TOKEN_SUBSTRING_MATCH_SCORE - term.length
        }

        const fuzzyScore = getFuzzySubsequenceScore(token, term)
        return fuzzyScore > NO_SEARCH_MATCH_SCORE
          ? FUZZY_TOKEN_MATCH_BASE_SCORE + fuzzyScore
          : NO_SEARCH_MATCH_SCORE
      })
    )

    if (termScore <= NO_SEARCH_MATCH_SCORE) return NO_SEARCH_MATCH_SCORE
    totalScore += termScore
  }

  return totalScore
}

function searchExamples(
  index: ExampleSearchIndex,
  search: string
): AlgorithmExampleOption[] {
  const query = normalizeSearchText(search)
  if (!query) return index.entries.map((entry) => entry.example)

  const firstChar = query[0]
  const candidates = index.byFirstChar.get(firstChar) ?? index.entries
  const rankedExamples = candidates
    .map((entry, order) => ({
      example: entry.example,
      order,
      score: getExampleSearchScore(entry, query),
    }))
    .filter((result) => result.score > NO_SEARCH_MATCH_SCORE)
    .sort((a, b) => b.score - a.score || a.order - b.order)

  return rankedExamples.map((result) => result.example)
}

function groupExamplesByCategory(examples: AlgorithmExampleOption[]) {
  const groups = new Map<string, AlgorithmExampleOption[]>()

  examples.forEach((example) => {
    const category = example.category ?? DEFAULT_EXAMPLE_CATEGORY
    groups.set(category, [...(groups.get(category) ?? []), example])
  })

  return [...groups.entries()]
}

function ExampleCombobox({
  examples,
  selectedExampleId,
  onExampleChange,
}: {
  examples: AlgorithmExampleOption[]
  selectedExampleId: string
  onExampleChange: (exampleId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedExample = examples.find(
    (example) => example.id === selectedExampleId
  )
  const searchIndex = useMemo(
    () => createExampleSearchIndex(examples),
    [examples]
  )
  const groupedExamples = useMemo(
    () => groupExamplesByCategory(searchExamples(searchIndex, search)),
    [searchIndex, search]
  )

  useEffect(() => {
    if (!open) return

    searchInputRef.current?.focus()

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open])

  const handleSelect = (exampleId: string) => {
    onExampleChange(exampleId)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id="algorithm-example"
        type="button"
        role="combobox"
        aria-label="Example"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="pixel-field [--pixel-field-shell:rgb(var(--input))] [--pixel-field-fill:rgb(var(--background))] flex h-9 w-full cursor-pointer items-center justify-between whitespace-nowrap border border-input px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors hover:border-ring hover:[--pixel-field-fill:rgb(var(--secondary))] focus:outline-none focus:ring-1 focus:ring-ring"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">
          {selectedExample?.label ??
            (selectedExampleId === 'custom'
              ? 'Custom code'
              : 'Choose an example')}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="ml-2 h-4 w-4 shrink-0 text-muted-foreground"
        />
      </button>
      {open && (
        <div className="pixel-panel absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-hidden border bg-popover p-2 text-popover-foreground shadow-md">
          <Input
            ref={searchInputRef}
            aria-label="Search examples"
            placeholder="Search examples..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false)
              }
            }}
          />
          <div role="listbox" className="mt-2 max-h-60 overflow-y-auto">
            {selectedExampleId === 'custom' && (
              <div className="px-5 py-1.5 text-sm text-muted-foreground">
                Custom code
              </div>
            )}
            {groupedExamples.length > 0 ? (
              groupedExamples.map(([category, groupExamples]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {category}
                  </div>
                  {groupExamples.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      role="option"
                      aria-selected={example.id === selectedExampleId}
                      className={[
                        'block w-full cursor-pointer rounded-sm py-1.5 pl-5 pr-2 text-left text-sm outline-none hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground',
                        example.id === selectedExampleId
                          ? 'font-semibold text-primary'
                          : '',
                      ].join(' ')}
                      onClick={() => handleSelect(example.id)}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No examples found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EditorTabContent({
  algorithmExamples,
  selectedExampleId,
  lintErrors,
  compilationResult,
  onExampleChange,
  onCompile,
}: EditorTabContentProps) {
  return (
    <div className="flex h-auto flex-col p-6 lg:h-full">
      <div className="flex-none mb-6 space-y-4">
        <Stack spacing="xs">
          <Label htmlFor="algorithm-example" className="mb-1 block">
            Example
          </Label>
          <ExampleCombobox
            examples={algorithmExamples}
            selectedExampleId={selectedExampleId}
            onExampleChange={onExampleChange}
          />
        </Stack>
        <Button
          onClick={onCompile}
          disabled={lintErrors.length > 0}
          className="w-full shadow-lg hover:shadow-xl transition-all h-11 text-base font-semibold"
        >
          Compile Code
        </Button>
        <Heading level={3} className="text-xl">
          Compilation Status
        </Heading>
      </div>
      <div className="flex-1 min-h-0">
        <CompilationPanel result={compilationResult} lintErrors={lintErrors} />
      </div>
    </div>
  )
}

function VerificationTabContent({
  functionSignature,
  defaultInputValues,
  onRunCode,
  onVerificationInputChange,
}: VerificationTabContentProps) {
  if (functionSignature) {
    return (
      <Suspense fallback={null}>
        <InputForm
          signature={functionSignature}
          defaultInputValues={defaultInputValues}
          onSubmit={onRunCode}
          onRawInputChange={onVerificationInputChange}
        />
      </Suspense>
    )
  }

  return (
    <Card className="bg-background/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Run Script</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack spacing="md">
          <Paragraph variant="muted">
            No specific function signature detected. Run the script directly?
          </Paragraph>
          <Button onClick={() => onRunCode({})} className="w-full">
            Run Now
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

function RuntimeTabContent({
  executionState,
  isRunning,
  playbackInterval,
  onPlaybackIntervalChange,
  onStepForward,
  onStepBackward,
  onRunAll,
  onPause,
  onResetToStart,
  onSkipToEnd,
  onJumpToStep,
  autoOpenPrimaryVisualization,
}: RuntimeTabContentProps) {
  if (!executionState) return null

  return (
    <div className="flex h-auto flex-col space-y-6 p-6 lg:h-full">
      <Suspense fallback={null}>
        <Controls
          onStepForward={onStepForward}
          onStepBackward={onStepBackward}
          onRunAll={onRunAll}
          onPause={onPause}
          onSkipToEnd={onSkipToEnd}
          onResetToStart={onResetToStart}
          isRunning={isRunning}
          isComplete={executionState.isComplete}
          currentStep={executionState.currentStep}
          playbackInterval={playbackInterval}
          onPlaybackIntervalChange={onPlaybackIntervalChange}
        />
      </Suspense>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Suspense fallback={null}>
          <Visualizer
            executionState={executionState}
            isRunning={isRunning}
            autoOpenPrimaryVisualization={autoOpenPrimaryVisualization}
            onPause={onPause}
            onRunAll={onRunAll}
            onReset={onResetToStart}
            onStepForward={onStepForward}
            onStepBackward={onStepBackward}
            onSkipToEnd={onSkipToEnd}
            onJumpToStep={onJumpToStep}
          />
        </Suspense>
      </div>
    </div>
  )
}

export function ControlPanel({
  mode,
  compilationResult,
  lintErrors,
  functionSignature,
  defaultInputValues,
  executionState,
  isRunning,
  playbackInterval,
  algorithmExamples,
  selectedExampleId,
  viewViewAnimationSrc,
  onViewViewAnimationLoad,
  showViewViewMonitor = true,
  autoOpenPrimaryVisualization = true,
  onModeChange,
  onExampleChange,
  onCompile,
  onRunCode,
  onVerificationInputChange,
  onPlaybackIntervalChange,
  onStepForward,
  onStepBackward,
  onRunAll,
  onPause,
  onResetToStart,
  onSkipToEnd,
  onJumpToStep,
}: ControlPanelProps) {
  return (
    <aside className="flex h-auto w-full min-w-0 flex-none flex-col overflow-visible bg-background lg:h-full lg:flex-[2_1_0] lg:overflow-hidden">
      {showViewViewMonitor && (
        <ViewViewMonitor
          viewViewAnimationSrc={viewViewAnimationSrc}
          onViewViewAnimationLoad={onViewViewAnimationLoad}
          className="mb-4 flex-none"
        />
      )}
      <Tabs
        value={mode}
        onValueChange={(val) => onModeChange(val as AppMode)}
        className="sidebar-tabs flex min-h-0 flex-none flex-col lg:flex-1"
      >
        <div className="sidebar-tabs__header hidden flex-none bg-background lg:block">
          <TabsList className="sidebar-tabs__list grid w-full grid-cols-3 bg-transparent">
            <TabsTrigger
              value="editor"
              className="sidebar-tabs__trigger data-[state=active]:bg-primary data-[state=active]:text-background"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              disabled={!compilationResult?.success}
              className="sidebar-tabs__trigger data-[state=active]:bg-primary data-[state=active]:text-background"
            >
              Verification
            </TabsTrigger>
            <TabsTrigger
              value="runtime"
              disabled={!executionState}
              className="sidebar-tabs__trigger data-[state=active]:bg-primary data-[state=active]:text-background"
            >
              Runtime
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="sidebar-tabs__panel min-h-0 flex-none overflow-visible border lg:flex-1 lg:overflow-y-auto lg:border-0">
          <TabsContent value="editor" className="mt-0 h-auto lg:h-full">
            <EditorTabContent
              algorithmExamples={algorithmExamples}
              selectedExampleId={selectedExampleId}
              lintErrors={lintErrors}
              compilationResult={compilationResult}
              onExampleChange={onExampleChange}
              onCompile={onCompile}
            />
          </TabsContent>

          <TabsContent
            value="verification"
            className="mt-0 h-auto p-6 lg:h-full"
          >
            <VerificationTabContent
              functionSignature={functionSignature}
              defaultInputValues={defaultInputValues}
              onRunCode={onRunCode}
              onVerificationInputChange={onVerificationInputChange}
            />
          </TabsContent>

          <TabsContent value="runtime" className="mt-0 h-auto lg:h-full">
            <RuntimeTabContent
              executionState={executionState}
              isRunning={isRunning}
              playbackInterval={playbackInterval}
              autoOpenPrimaryVisualization={autoOpenPrimaryVisualization}
              onPlaybackIntervalChange={onPlaybackIntervalChange}
              onStepForward={onStepForward}
              onStepBackward={onStepBackward}
              onRunAll={onRunAll}
              onPause={onPause}
              onResetToStart={onResetToStart}
              onSkipToEnd={onSkipToEnd}
              onJumpToStep={onJumpToStep}
            />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
