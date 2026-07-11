import type { Monaco, OnMount } from '@monaco-editor/react'
import type { CompilationError } from '@/entities/code'
import { getPreparedTypeScriptEditorClassSource } from '@/entities/code/compiler'
import { define, equals, isObject } from '@/shared/lib/guards'

export type MonacoEditor = Parameters<OnMount>[0]
export type MonacoHandle = {
  monaco: Monaco
}
export type ValidationCallbackRef = {
  current: ((markers: CompilationError[]) => void) | undefined
}

type MonacoMarker = ReturnType<Monaco['editor']['getModelMarkers']>[number]
type MonacoMarkerData = Parameters<
  Monaco['editor']['setModelMarkers']
>[2][number]

const PREPARED_CLASSES_LIB_PATH = 'ts:algorithm-visualizer-prepared-classes.ts'
const EXTERNAL_MARKER_OWNER = 'owner'
const DEFAULT_EDITOR_FONT_SIZE = 14
const DEFAULT_EXTERNAL_MARKER_WIDTH = 10

export const DEFAULT_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: DEFAULT_EDITOR_FONT_SIZE,
  lineNumbers: 'on',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  automaticLayout: true,
} as const

const isCanceledCode = equals('ERR_CANCELED')
const isCanceledLabel = equals('Canceled')

export const isMonacoCanceledError = define<Record<PropertyKey, unknown>>(
  (reason) =>
    isObject(reason) &&
    (isCanceledCode(reason.code) ||
      (isCanceledLabel(reason.name) && isCanceledLabel(reason.message)))
)

const mapMarkerToCompilationError = (
  marker: MonacoMarker,
  monaco: Monaco
): CompilationError => ({
  line: marker.startLineNumber,
  column: marker.startColumn,
  message: marker.message,
  severity:
    marker.severity === monaco.MarkerSeverity.Error ? 'error' : 'warning',
})

const setPreparedClassesLibContent = (
  monaco: Monaco,
  content: string
): void => {
  monaco.typescript.typescriptDefaults.setExtraLibs([
    {
      content,
      filePath: PREPARED_CLASSES_LIB_PATH,
    },
  ])
}

export const setPreparedClassesLib = (monaco: Monaco, code: string) => {
  const content = getPreparedTypeScriptEditorClassSource(code)

  setPreparedClassesLibContent(monaco, content)
  return content
}

export const syncPreparedClassesLib = ({
  monaco,
  code,
  currentContent,
}: {
  monaco: Monaco
  code: string
  currentContent: string | null
}): string => {
  const nextContent = getPreparedTypeScriptEditorClassSource(code)

  if (currentContent === nextContent) {
    return currentContent
  }

  setPreparedClassesLibContent(monaco, nextContent)
  return nextContent
}

export const updateEditorOptions = (
  editor: MonacoEditor,
  readOnly: boolean
): void => {
  editor.updateOptions({
    ...DEFAULT_EDITOR_OPTIONS,
    readOnly,
  })
}

export const subscribeToValidationMarkers = (
  editor: MonacoEditor,
  monaco: Monaco,
  onValidateRef: ValidationCallbackRef
) =>
  monaco.editor.onDidChangeMarkers(() => {
    const model = editor.getModel()
    if (!model || !onValidateRef.current) {
      return
    }

    const markers = monaco.editor.getModelMarkers({
      resource: model.uri,
    })
    onValidateRef.current(
      markers.map((marker: MonacoMarker) =>
        mapMarkerToCompilationError(marker, monaco)
      )
    )
  })

const createExternalMarkers = (
  errors: CompilationError[],
  monaco: Monaco
): MonacoMarkerData[] =>
  errors.map((error) => ({
    startLineNumber: error.line,
    startColumn: error.column,
    endLineNumber: error.line,
    endColumn: error.column + DEFAULT_EXTERNAL_MARKER_WIDTH,
    message: error.message,
    severity:
      error.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
  }))

export const updateHighlightedLineDecorations = ({
  editor,
  monaco,
  decorations,
  highlightedLine,
}: {
  editor: MonacoEditor
  monaco: Monaco
  decorations: string[]
  highlightedLine: number
}): string[] => {
  const nextDecorations = editor.deltaDecorations(decorations, [
    {
      range: new monaco.Range(highlightedLine, 1, highlightedLine, 1),
      options: {
        isWholeLine: true,
        className: 'highlighted-line',
        glyphMarginClassName: 'highlighted-line-glyph',
      },
    },
  ])

  editor.revealLineInCenter(highlightedLine)
  return nextDecorations
}

export const clearHighlightedLineDecorations = (
  editor: MonacoEditor,
  decorations: string[]
): string[] => editor.deltaDecorations(decorations, [])

export const setExternalMarkers = (
  editor: MonacoEditor,
  monaco: Monaco,
  errors: CompilationError[]
): void => {
  const model = editor.getModel()
  if (!model) {
    return
  }

  monaco.editor.setModelMarkers(
    model,
    EXTERNAL_MARKER_OWNER,
    createExternalMarkers(errors, monaco)
  )
}
