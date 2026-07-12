import { ViewViewMonitor } from '@/features/visualization'
import { oneOfValues } from '@/shared/lib/guards'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'
import type { ControlPanelProps } from '../model/types'
import { EditorTabContent } from './editor-tab-content'
import { RuntimeTabContent } from './runtime-tab-content'
import { VerificationTabContent } from './verification-tab-content'

const isAppMode = oneOfValues('editor', 'verification', 'runtime')

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
        onValueChange={(value) => {
          if (isAppMode(value)) onModeChange(value)
        }}
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
