import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { OnMount } from '@monaco-editor/react'
import type { CompilationError } from '@/entities/code'
import { configureMonaco, prepareMonaco } from '../lib/configure-monaco'
import {
  clearHighlightedLineDecorations,
  DEFAULT_EDITOR_OPTIONS,
  isMonacoCanceledError,
  setExternalMarkers,
  setPreparedClassesLib,
  subscribeToValidationMarkers,
  syncPreparedClassesLib,
  updateEditorOptions,
  updateHighlightedLineDecorations,
  type MonacoEditor,
  type MonacoHandle,
} from '../lib/monaco-editor-helpers'
import { registerEditorCommands } from '../lib/register-editor-commands'
import { registerFormattingProvider } from '../lib/register-formatting-provider'
import { CodeEditorFrame } from './code-editor-frame'
import { CodeEditorSpinner } from './code-editor-spinner'

configureMonaco()

/** Preloads Monaco so mounting the rich editor does not start from cold. */
export const prepareCodeEditor = prepareMonaco

/**
 * Props for CodeEditor component
 */
type CodeEditorProps = {
  /** Current code value */
  value: string
  /** Callback when code changes */
  onChange: (value: string) => void
  /** Callback when validation markers change */
  onValidate?: (markers: CompilationError[]) => void
  /** List of errors to display (external errors) */
  errors?: CompilationError[]
  /** Editor height */
  height?: string
  /** Line number to highlight (for runtime visualization) */
  highlightedLine?: number
  /** Whether editor is read-only */
  readOnly?: boolean
  /** Monaco language id for the current source language */
  language?: string
}

/**
 * Monaco-based code editor with TypeScript support
 *
 * Provides syntax highlighting, auto-completion, and error markers
 * for TypeScript/JavaScript code editing.
 *
 * @param props - Component props
 * @returns CodeEditor component
 *
 * @example
 * ```tsx
 * <CodeEditor
 *   value={code}
 *   onChange={setCode}
 *   errors={compilationErrors}
 *   height="37.5rem"
 *   highlightedLine={5}
 * />
 * ```
 */
export function CodeEditor({
  value,
  onChange,
  onValidate,
  errors = [],
  height = '37.5rem',
  highlightedLine,
  readOnly = false,
  language = 'typescript',
}: CodeEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value ?? '')
  }

  const editorRef = useRef<MonacoEditor | null>(null)
  const monacoRef = useRef<MonacoHandle | null>(null)
  const onValidateRef = useRef(onValidate)
  const decorationsRef = useRef<string[]>([])
  const preparedClassesLibRef = useRef<string | null>(null)
  const editorDisposablesRef = useRef<Array<{ dispose: () => void }>>([])

  useEffect(() => {
    onValidateRef.current = onValidate
  }, [onValidate])

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isMonacoCanceledError(event.reason)) {
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = { monaco }

    updateEditorOptions(editor, readOnly)

    editorDisposablesRef.current.push(
      subscribeToValidationMarkers(editor, monaco, onValidateRef),
      {
        dispose: registerFormattingProvider(monaco),
      }
    )

    if (language === 'typescript') {
      preparedClassesLibRef.current = setPreparedClassesLib(monaco, value)
    }

    registerEditorCommands(editor, monaco)
  }

  useEffect(
    () => () => {
      editorDisposablesRef.current.forEach((disposable) => disposable.dispose())
      editorDisposablesRef.current = []
    },
    []
  )

  useEffect(() => {
    if (!editorRef.current) {
      return
    }

    updateEditorOptions(editorRef.current, readOnly)
  }, [readOnly])

  useEffect(() => {
    if (!monacoRef.current || language !== 'typescript') {
      return
    }

    preparedClassesLibRef.current = syncPreparedClassesLib({
      monaco: monacoRef.current.monaco,
      code: value,
      currentContent: preparedClassesLibRef.current,
    })
  }, [language, value])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current?.monaco
    if (!editor) {
      return
    }

    if (monaco && highlightedLine !== undefined) {
      decorationsRef.current = updateHighlightedLineDecorations({
        editor,
        monaco,
        decorations: decorationsRef.current,
        highlightedLine,
      })
      return
    }

    if (highlightedLine === undefined) {
      decorationsRef.current = clearHighlightedLineDecorations(
        editor,
        decorationsRef.current
      )
    }
  }, [highlightedLine])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current?.monaco
    if (!editor || !monaco) {
      return
    }

    setExternalMarkers(editor, monaco, errors)
  }, [errors])

  return (
    <CodeEditorFrame height={height}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        loading={<CodeEditorSpinner />}
        options={DEFAULT_EDITOR_OPTIONS}
      />
    </CodeEditorFrame>
  )
}
