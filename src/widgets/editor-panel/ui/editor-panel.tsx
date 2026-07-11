import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Button, Card } from '@/shared/ui'
import type { CompilationError } from '@/entities/code'
import { CodeEditorFrame } from '@/features/code-editing'
import { ShareButton } from '@/features/shareable-url'

const CodeEditor = lazy(() =>
  import('@/features/code-editing/code-editor').then((module) => ({
    default: module.CodeEditor,
  }))
)

const RICH_EDITOR_IDLE_LOAD_DELAY_MS = 2_000

/**
 * Props for EditorPanel component.
 */
type EditorPanelProps = {
  /** Desktop header content composed by the page layer. */
  header: ReactNode
  /** Current source code value. */
  sourceCode: string
  /** Monaco language id for the editor. */
  editorLanguage: string
  /** Optional source line highlighted during runtime playback. */
  highlightedLine?: number
  /** Callback when source code changes. */
  onEditorChange: (value: string) => void
  /** Callback to run the default demo directly. */
  onRunDemo: () => void
  /** Callback to create a shareable URL for the current state. */
  onCreateShareUrl: () => Promise<string>
  /** Callback when editor validation markers change. */
  onValidate: (errors: CompilationError[]) => void
}

type LightweightCodeEditorProps = {
  /** Current source code value. */
  value: string
  /** Callback when the source code changes. */
  onChange: (value: string) => void
  /** Callback when the lightweight editor should activate the rich editor. */
  onActivate: () => void
}

function LightweightCodeEditor({
  value,
  onChange,
  onActivate,
}: LightweightCodeEditorProps) {
  return (
    <CodeEditorFrame>
      <textarea
        aria-label="Code Editor"
        className="h-full w-full resize-none border-0 bg-[#1e1e1e] px-4 py-3 font-mono text-sm leading-6 text-[#d4d4d4] outline-none"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onActivate}
      />
    </CodeEditorFrame>
  )
}

export function EditorPanel({
  header,
  sourceCode,
  editorLanguage,
  highlightedLine,
  onEditorChange,
  onRunDemo,
  onCreateShareUrl,
  onValidate,
}: EditorPanelProps) {
  const [shouldLoadRichEditor, setShouldLoadRichEditor] = useState(false)

  useEffect(() => {
    if (shouldLoadRichEditor || typeof window === 'undefined') {
      return
    }

    let idleId: number | null = null
    const loadRichEditor = () => setShouldLoadRichEditor(true)
    const timerId = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(loadRichEditor, { timeout: 1_500 })
        return
      }

      loadRichEditor()
    }, RICH_EDITOR_IDLE_LOAD_DELAY_MS)

    return () => {
      window.clearTimeout(timerId)

      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
    }
  }, [shouldLoadRichEditor])

  return (
    <main className="flex w-full min-w-0 flex-none flex-col lg:min-h-0 lg:flex-[3_1_0]">
      <div className="mb-4 flex flex-none flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {header}
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <Button
              type="button"
              onClick={onRunDemo}
              className="h-11 min-w-0 flex-1 px-3 text-sm font-semibold shadow-lg transition-all hover:shadow-xl sm:max-w-[15rem] sm:text-base lg:w-[15rem] lg:flex-none lg:px-4"
            >
              Run demo
            </Button>
            <ShareButton
              createShareUrl={onCreateShareUrl}
              className="h-11 w-[8.5rem] flex-none sm:w-[10rem] lg:hidden"
            />
          </div>
        </div>
        <div className="hidden flex-none items-center justify-end lg:flex">
          <ShareButton
            createShareUrl={onCreateShareUrl}
            className="h-20 max-w-[18rem]"
          />
        </div>
      </div>
      <Card className="flex h-[28rem] min-w-0 w-full flex-none flex-col overflow-hidden border shadow-2xl lg:h-auto lg:min-h-[25rem] lg:flex-1">
        <div className="flex-1 min-w-0 w-full relative h-full">
          {shouldLoadRichEditor ? (
            <Suspense
              fallback={
                <LightweightCodeEditor
                  value={sourceCode}
                  onChange={onEditorChange}
                  onActivate={() => setShouldLoadRichEditor(true)}
                />
              }
            >
              <CodeEditor
                value={sourceCode}
                onChange={onEditorChange}
                onValidate={onValidate}
                height="100%"
                language={editorLanguage}
                highlightedLine={highlightedLine}
              />
            </Suspense>
          ) : (
            <LightweightCodeEditor
              value={sourceCode}
              onChange={onEditorChange}
              onActivate={() => setShouldLoadRichEditor(true)}
            />
          )}
        </div>
      </Card>
    </main>
  )
}
