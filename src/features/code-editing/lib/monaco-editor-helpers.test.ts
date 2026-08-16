import { describe, expect, it, vi } from 'vite-plus/test'
import type { Monaco } from '@monaco-editor/react'
import type { CompilationError } from '@/entities/code'

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
} from './monaco-editor-helpers'

const createMonacoMock = () => {
  const rangeCalls: Array<[number, number, number, number]> = []
  class Range {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number

    constructor(
      startLine: number,
      startColumn: number,
      endLine: number,
      endColumn: number
    ) {
      rangeCalls.push([startLine, startColumn, endLine, endColumn])
      this.startLine = startLine
      this.startColumn = startColumn
      this.endLine = endLine
      this.endColumn = endColumn
    }
  }
  const setModelMarkers = vi.fn()
  const getModelMarkers = vi.fn()
  const onDidChangeMarkers = vi.fn()
  const setExtraLibs = vi.fn()

  const monaco = {
    rangeCalls,
    MarkerSeverity: {
      Error: 8,
      Warning: 4,
      Hint: 1,
    },
    Range,
    editor: {
      getModelMarkers,
      onDidChangeMarkers,
      setModelMarkers,
    },
    typescript: {
      typescriptDefaults: {
        setExtraLibs,
      },
    },
  }

  return {
    ...monaco,
    api: monaco as unknown as Monaco,
  }
}

const createEditorWithModel = (model: unknown) => {
  const getModel = vi.fn(() => model)

  return {
    editor: {
      getModel,
    } as unknown as MonacoEditor,
    getModel,
  }
}

const getMarkerChangeHandler = (
  monaco: ReturnType<typeof createMonacoMock>,
  callIndex = 0
) => monaco.editor.onDidChangeMarkers.mock.calls[callIndex][0]

describe('monaco editor helpers', () => {
  it('recognizes Monaco cancellation errors', () => {
    expect(isMonacoCanceledError({ code: 'ERR_CANCELED' })).toBe(true)
    expect(
      isMonacoCanceledError({ name: 'Canceled', message: 'Canceled' })
    ).toBe(true)
    expect(isMonacoCanceledError(new Error('different'))).toBe(false)
    expect(isMonacoCanceledError(null)).toBe(false)
  })

  it('applies shared editor options with read-only state', () => {
    const updateOptions = vi.fn()
    const editor = {
      updateOptions,
    } as unknown as MonacoEditor

    updateEditorOptions(editor, true)

    expect(updateOptions).toHaveBeenCalledWith({
      ...DEFAULT_EDITOR_OPTIONS,
      readOnly: true,
    })
    expect(DEFAULT_EDITOR_OPTIONS.hover).toEqual({
      enabled: 'on',
      delay: 300,
      sticky: true,
    })
    expect(DEFAULT_EDITOR_OPTIONS.fixedOverflowWidgets).toBe(true)
  })

  it('updates and clears highlighted line decorations', () => {
    const deltaDecorations = vi.fn(() => ['next-decoration'])
    const revealLineInCenter = vi.fn()
    const editor = {
      deltaDecorations,
      revealLineInCenter,
    } as unknown as MonacoEditor
    const monaco = createMonacoMock()

    const nextDecorations = updateHighlightedLineDecorations({
      editor,
      monaco: monaco.api,
      decorations: ['previous-decoration'],
      highlightedLine: 7,
    })

    expect(nextDecorations).toEqual(['next-decoration'])
    expect(monaco.rangeCalls).toEqual([[7, 1, 7, 1]])
    expect(deltaDecorations).toHaveBeenCalledWith(
      ['previous-decoration'],
      [
        {
          range: {
            startLine: 7,
            startColumn: 1,
            endLine: 7,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'highlighted-line',
            glyphMarginClassName: 'highlighted-line-glyph',
          },
        },
      ]
    )
    expect(revealLineInCenter).toHaveBeenCalledWith(7)

    clearHighlightedLineDecorations(editor, ['next-decoration'])

    expect(deltaDecorations).toHaveBeenLastCalledWith(['next-decoration'], [])
  })

  it('maps external compilation errors to Monaco markers', () => {
    const model = { uri: 'file:///source.ts' }
    const { editor, getModel } = createEditorWithModel(model)
    const monaco = createMonacoMock()
    const errors: CompilationError[] = [
      {
        line: 3,
        column: 5,
        message: 'Expected number',
        severity: 'error',
      },
      {
        line: 8,
        column: 2,
        message: 'Unused value',
        severity: 'warning',
      },
    ]

    setExternalMarkers(editor, monaco.api, errors)

    expect(getModel).toHaveBeenCalled()
    expect(monaco.editor.setModelMarkers).toHaveBeenCalledWith(model, 'owner', [
      {
        startLineNumber: 3,
        startColumn: 5,
        endLineNumber: 3,
        endColumn: 15,
        message: 'Expected number',
        severity: 8,
      },
      {
        startLineNumber: 8,
        startColumn: 2,
        endLineNumber: 8,
        endColumn: 12,
        message: 'Unused value',
        severity: 4,
      },
    ])
  })

  it('ignores the entry function hint but keeps unused helpers and locals', () => {
    const model = {
      uri: 'file:///source.ts',
      getValue: () => `function solve(): void {
  const unused = 1
}

function helper(): void {
}`,
    }
    const { editor } = createEditorWithModel(model)
    const monaco = createMonacoMock()
    const onValidate = vi.fn()
    const disposable = { dispose: vi.fn() }

    monaco.editor.getModelMarkers.mockReturnValue([
      {
        startLineNumber: 4,
        startColumn: 6,
        message: 'Broken expression',
        severity: monaco.MarkerSeverity.Error,
      },
      {
        startLineNumber: 9,
        startColumn: 2,
        message: 'Suspicious value',
        severity: monaco.MarkerSeverity.Warning,
      },
      {
        startLineNumber: 1,
        startColumn: 10,
        message: "'solve' is declared but its value is never read.",
        severity: monaco.MarkerSeverity.Hint,
        code: '6133',
      },
      {
        startLineNumber: 2,
        startColumn: 9,
        message: "'unused' is declared but its value is never read.",
        severity: monaco.MarkerSeverity.Hint,
        code: '6133',
      },
      {
        startLineNumber: 5,
        startColumn: 10,
        message: "'helper' is declared but its value is never read.",
        severity: monaco.MarkerSeverity.Hint,
        code: '6133',
      },
    ])
    monaco.editor.onDidChangeMarkers.mockReturnValue(disposable)

    const returnedDisposable = subscribeToValidationMarkers(
      editor,
      monaco.api,
      {
        current: onValidate,
      }
    )

    const handleMarkersChanged = getMarkerChangeHandler(monaco)
    handleMarkersChanged()

    expect(returnedDisposable).toBe(disposable)
    expect(monaco.editor.getModelMarkers).toHaveBeenCalledWith({
      resource: model.uri,
    })
    expect(onValidate).toHaveBeenCalledWith([
      {
        line: 4,
        column: 6,
        message: 'Broken expression',
        severity: 'error',
      },
      {
        line: 9,
        column: 2,
        message: 'Suspicious value',
        severity: 'warning',
      },
      {
        line: 2,
        column: 9,
        message: "'unused' is declared but its value is never read.",
        severity: 'warning',
      },
      {
        line: 5,
        column: 10,
        message: "'helper' is declared but its value is never read.",
        severity: 'warning',
      },
    ])
  })

  it('ignores an unused arrow function entry hint', () => {
    const model = {
      uri: 'file:///source.ts',
      getValue: () =>
        'const canVisit = (value: number): boolean => value > 0',
    }
    const { editor } = createEditorWithModel(model)
    const monaco = createMonacoMock()
    const onValidate = vi.fn()

    monaco.editor.getModelMarkers.mockReturnValue([
      {
        startLineNumber: 1,
        startColumn: 7,
        message: "'canVisit' is declared but its value is never read.",
        severity: monaco.MarkerSeverity.Hint,
        code: '6133',
      },
    ])
    monaco.editor.onDidChangeMarkers.mockReturnValue({ dispose: vi.fn() })

    subscribeToValidationMarkers(editor, monaco.api, {
      current: onValidate,
    })
    getMarkerChangeHandler(monaco)()

    expect(onValidate).toHaveBeenCalledWith([])
  })

  it('ignores unused hints for every entry function overload', () => {
    const model = {
      uri: 'file:///source.ts',
      getValue: () => `function solve(value: number): number;
function solve(value: string): string;
function solve(value: number | string): number | string {
  return value
}

function helper(): void {}`,
    }
    const { editor } = createEditorWithModel(model)
    const monaco = createMonacoMock()
    const onValidate = vi.fn()

    monaco.editor.getModelMarkers.mockReturnValue([
      ...[1, 2, 3].map((line) => ({
        startLineNumber: line,
        startColumn: 10,
        message: "'solve' is declared but its value is never read.",
        severity: monaco.MarkerSeverity.Hint,
        code: '6133',
      })),
      {
        startLineNumber: 7,
        startColumn: 10,
        message: "'helper' is declared but its value is never read.",
        severity: monaco.MarkerSeverity.Hint,
        code: '6133',
      },
    ])
    monaco.editor.onDidChangeMarkers.mockReturnValue({ dispose: vi.fn() })

    subscribeToValidationMarkers(editor, monaco.api, {
      current: onValidate,
    })
    getMarkerChangeHandler(monaco)()

    expect(onValidate).toHaveBeenCalledWith([
      {
        line: 7,
        column: 10,
        message: "'helper' is declared but its value is never read.",
        severity: 'warning',
      },
    ])
  })

  it('does not map validation markers without a model or callback', () => {
    const monaco = createMonacoMock()
    monaco.editor.onDidChangeMarkers.mockReturnValue({ dispose: vi.fn() })

    subscribeToValidationMarkers(
      createEditorWithModel(null).editor,
      monaco.api,
      {
        current: vi.fn(),
      }
    )
    getMarkerChangeHandler(monaco)()

    subscribeToValidationMarkers(
      createEditorWithModel({ uri: 'file:///source.ts' }).editor,
      monaco.api,
      { current: undefined }
    )
    getMarkerChangeHandler(monaco, 1)()

    expect(monaco.editor.getModelMarkers).not.toHaveBeenCalled()
  })

  it('sets prepared class editor libs and returns the generated content', () => {
    const monaco = createMonacoMock()

    const content = setPreparedClassesLib(
      monaco.api,
      'function search(root: TreeNode | null) { return root?.val ?? 0 }'
    )

    expect(content).toContain('class TreeNode')
    expect(
      monaco.typescript.typescriptDefaults.setExtraLibs
    ).toHaveBeenCalledWith([
      {
        content,
        filePath: 'ts:algorithm-visualizer-prepared-classes.ts',
      },
    ])
  })

  it('skips prepared class editor lib updates when content is unchanged', () => {
    const monaco = createMonacoMock()
    const code = 'function search(root: TreeNode | null) { return root }'
    const currentContent = setPreparedClassesLib(monaco, code)

    monaco.typescript.typescriptDefaults.setExtraLibs.mockClear()

    const nextContent = syncPreparedClassesLib({
      monaco: monaco.api,
      code,
      currentContent,
    })

    expect(nextContent).toBe(currentContent)
    expect(
      monaco.typescript.typescriptDefaults.setExtraLibs
    ).not.toHaveBeenCalled()
  })
})
