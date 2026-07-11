import { describe, expect, it, vi } from 'vite-plus/test'
import type { Monaco, OnMount } from '@monaco-editor/react'

import { registerEditorCommands } from './register-editor-commands'

type MonacoEditor = Parameters<OnMount>[0]

const createMonacoCommandMock = () => ({
  KeyMod: {
    CtrlCmd: 1,
    Alt: 2,
    Shift: 4,
    WinCtrl: 8,
  },
  KeyCode: {
    KeyS: 10,
    KeyL: 20,
    KeyF: 30,
    KeyI: 40,
    KeyD: 50,
    KeyG: 60,
    KeyU: 70,
    KeyK: 80,
    UpArrow: 90,
    DownArrow: 100,
  },
})

const createEditorCommandMock = () => {
  const addCommand = vi.fn()
  const trigger = vi.fn()
  const formatRun = vi.fn()
  const getAction = vi.fn(() => ({
    run: formatRun,
  }))

  return {
    editor: {
      addCommand,
      trigger,
      getAction,
    } as unknown as MonacoEditor,
    addCommand,
    trigger,
    getAction,
    formatRun,
  }
}

const runRegisteredCommand = (
  addCommand: ReturnType<typeof vi.fn>,
  commandIndex: number
) => {
  const command = addCommand.mock.calls[commandIndex][1]
  command()
}

describe('registerEditorCommands', () => {
  const actionCommandStartIndex = 5
  const actionIds = [
    'editor.action.addSelectionToNextFindMatch',
    'editor.action.selectHighlights',
    'editor.action.gotoLine',
    'editor.action.transformToUppercase',
    'editor.action.deleteLines',
    'editor.action.moveLinesUpAction',
    'editor.action.moveLinesDownAction',
    'editor.action.copyLinesUpAction',
    'editor.action.copyLinesDownAction',
  ]

  it('registers format and editor action shortcuts', () => {
    const { editor, addCommand } = createEditorCommandMock()
    const monaco = createMonacoCommandMock()

    registerEditorCommands(editor, monaco as unknown as Monaco)

    expect(addCommand).toHaveBeenCalledTimes(14)
    expect(addCommand.mock.calls.map(([keybinding]) => keybinding)).toEqual([
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyL,
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      monaco.KeyMod.WinCtrl | monaco.KeyCode.KeyI,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyU,
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK,
      monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
      monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
    ])
  })

  it('runs document formatting for format shortcuts', () => {
    const { editor, addCommand, getAction, formatRun } =
      createEditorCommandMock()

    registerEditorCommands(
      editor,
      createMonacoCommandMock() as unknown as Monaco
    )
    runRegisteredCommand(addCommand, 0)

    expect(getAction).toHaveBeenCalledWith('editor.action.formatDocument')
    expect(formatRun).toHaveBeenCalledTimes(1)
  })

  it('triggers Monaco editor actions for action shortcuts', () => {
    const { editor, addCommand, trigger } = createEditorCommandMock()

    registerEditorCommands(
      editor,
      createMonacoCommandMock() as unknown as Monaco
    )
    actionIds.forEach((_, index) => {
      runRegisteredCommand(addCommand, actionCommandStartIndex + index)
    })

    expect(trigger.mock.calls).toEqual(
      actionIds.map((actionId) => ['keyboard', actionId, {}])
    )
  })
})
