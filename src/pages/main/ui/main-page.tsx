import { useEffect, useState } from 'react'
import { useViewViewAnimationState } from '@/features/visualization'
import { AppHeader, MobileHeader } from '@/widgets/header'
import { ControlPanel } from '@/widgets/control-panel'
import { EditorPanel } from '@/widgets/editor-panel'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import { useAppState } from '../model/use-app-state'

const LARGE_SCREEN_QUERY = '(min-width: 1024px)'

function getIsLargeScreen(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }

  return window.matchMedia(LARGE_SCREEN_QUERY).matches
}

export function MainPage() {
  const [isLargeScreen, setIsLargeScreen] = useState(getIsLargeScreen)
  const {
    activeLanguage,
    mode,
    setMode,
    sourceCode,
    algorithmExamples,
    selectedExampleId,
    selectedExampleDefaultInputValues,
    compilationResult,
    lintErrors,
    setLintErrors,
    functionSignature,
    highlightedLine,
    executionState,
    isRunning,
    playbackInterval,
    setPlaybackInterval,
    handleStepForward,
    handleStepBackward,
    handleRunAll,
    handlePause,
    handleResetToStart,
    handleSkipToEnd,
    handleJumpToStep,
    handleCompile,
    handleRunCode,
    handleRunDemo,
    setVerificationInputValues,
    handleEditorChange,
    handleExampleChange,
    createCurrentShareUrl,
    shareRestoreError,
    pendingSharedRuntime,
    handleCancelSharedRuntime,
    handleConfirmSharedRuntime,
  } = useAppState()
  const viewViewAnimation = useViewViewAnimationState({
    mode,
    compilationResult,
    isRunning,
    isRuntimeComplete: executionState?.isComplete ?? false,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia(LARGE_SCREEN_QUERY)
    const handleChange = () => setIsLargeScreen(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground lg:h-screen lg:overflow-hidden">
      <MobileHeader
        mode={mode}
        onModeChange={setMode}
        isVerificationDisabled={!compilationResult?.success}
        isRuntimeDisabled={!executionState}
        viewViewAnimationSrc={viewViewAnimation.src}
        onViewViewAnimationLoad={viewViewAnimation.onAnimationLoad}
        showViewViewMonitor={!isLargeScreen}
      />

      <Dialog
        open={pendingSharedRuntime !== null}
        onOpenChange={(open) => !open && handleCancelSharedRuntime()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run shared custom code?</DialogTitle>
            <DialogDescription>
              This link contains custom code that has not run yet. Running it in
              an isolated worker prevents direct access to this page's DOM and
              local or session storage, but other browser APIs may still be
              available. Continue only if you trust the sender.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSharedRuntime}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSharedRuntime}>
              Run shared code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 flex-col gap-4 overflow-visible p-4 lg:overflow-hidden lg:p-6 lg:pt-8">
        {shareRestoreError && (
          <Alert variant="destructive" className="flex-none">
            <AlertTitle>Shared link error</AlertTitle>
            <AlertDescription>{shareRestoreError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-1 flex-col gap-6 overflow-visible lg:flex-row lg:overflow-hidden">
          <EditorPanel
            header={<AppHeader />}
            sourceCode={sourceCode}
            editorLanguage={activeLanguage}
            highlightedLine={highlightedLine}
            onEditorChange={handleEditorChange}
            onRunDemo={handleRunDemo}
            onCreateShareUrl={createCurrentShareUrl}
            onValidate={setLintErrors}
          />

          <ControlPanel
            mode={mode}
            compilationResult={compilationResult}
            lintErrors={lintErrors}
            functionSignature={functionSignature}
            executionState={executionState}
            isRunning={isRunning}
            playbackInterval={playbackInterval}
            algorithmExamples={algorithmExamples}
            selectedExampleId={selectedExampleId}
            defaultInputValues={selectedExampleDefaultInputValues}
            viewViewAnimationSrc={viewViewAnimation.src}
            onViewViewAnimationLoad={viewViewAnimation.onAnimationLoad}
            showViewViewMonitor={isLargeScreen}
            autoOpenPrimaryVisualization={isLargeScreen}
            onModeChange={setMode}
            onExampleChange={handleExampleChange}
            onCompile={handleCompile}
            onRunCode={handleRunCode}
            onVerificationInputChange={setVerificationInputValues}
            onPlaybackIntervalChange={setPlaybackInterval}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onRunAll={handleRunAll}
            onPause={handlePause}
            onResetToStart={handleResetToStart}
            onSkipToEnd={handleSkipToEnd}
            onJumpToStep={handleJumpToStep}
          />
        </div>
      </div>
    </div>
  )
}
