import type { Monaco, OnMount } from '@monaco-editor/react'

/**
 * Monaco editor instance passed to the editor mount callback.
 */
type MonacoEditor = Parameters<OnMount>[0]
type KeyModifierName = 'CtrlCmd' | 'Alt' | 'Shift' | 'WinCtrl'
type KeyCodeName =
  | 'KeyS'
  | 'KeyL'
  | 'KeyF'
  | 'KeyI'
  | 'KeyD'
  | 'KeyG'
  | 'KeyU'
  | 'KeyK'
  | 'UpArrow'
  | 'DownArrow'
type KeybindingSpec = {
  modifiers: KeyModifierName[]
  key: KeyCodeName
}
type EditorActionCommand = {
  keybinding: KeybindingSpec
  action: string
}

const FORMAT_KEYBINDINGS: KeybindingSpec[] = [
  { modifiers: ['CtrlCmd'], key: 'KeyS' },
  { modifiers: ['CtrlCmd', 'Alt'], key: 'KeyL' },
  { modifiers: ['Shift', 'Alt'], key: 'KeyF' },
  { modifiers: ['CtrlCmd', 'Shift'], key: 'KeyF' },
  { modifiers: ['WinCtrl'], key: 'KeyI' },
]

const ACTION_COMMANDS: EditorActionCommand[] = [
  {
    keybinding: { modifiers: ['CtrlCmd'], key: 'KeyD' },
    action: 'editor.action.addSelectionToNextFindMatch',
  },
  {
    keybinding: { modifiers: ['CtrlCmd', 'Shift'], key: 'KeyL' },
    action: 'editor.action.selectHighlights',
  },
  {
    keybinding: { modifiers: ['CtrlCmd'], key: 'KeyG' },
    action: 'editor.action.gotoLine',
  },
  {
    keybinding: { modifiers: ['CtrlCmd', 'Shift'], key: 'KeyU' },
    action: 'editor.action.transformToUppercase',
  },
  {
    keybinding: { modifiers: ['CtrlCmd', 'Shift'], key: 'KeyK' },
    action: 'editor.action.deleteLines',
  },
  {
    keybinding: { modifiers: ['Alt'], key: 'UpArrow' },
    action: 'editor.action.moveLinesUpAction',
  },
  {
    keybinding: { modifiers: ['Alt'], key: 'DownArrow' },
    action: 'editor.action.moveLinesDownAction',
  },
  {
    keybinding: { modifiers: ['Shift', 'Alt'], key: 'UpArrow' },
    action: 'editor.action.copyLinesUpAction',
  },
  {
    keybinding: { modifiers: ['Shift', 'Alt'], key: 'DownArrow' },
    action: 'editor.action.copyLinesDownAction',
  },
]

const createKeybinding = (monaco: Monaco, spec: KeybindingSpec): number =>
  spec.modifiers.reduce(
    (keybinding, modifier) => keybinding | monaco.KeyMod[modifier],
    monaco.KeyCode[spec.key]
  )

const triggerEditorAction = (editor: MonacoEditor, action: string): void => {
  editor.trigger('keyboard', action, {})
}

const runFormatDocument = (editor: MonacoEditor): void => {
  void editor.getAction('editor.action.formatDocument')?.run()
}

const registerFormatCommand = (
  editor: MonacoEditor,
  keybinding: number
): void => {
  editor.addCommand(keybinding, () => {
    runFormatDocument(editor)
  })
}

const registerActionCommand = (
  editor: MonacoEditor,
  keybinding: number,
  action: string
): void => {
  editor.addCommand(keybinding, () => {
    triggerEditorAction(editor, action)
  })
}

/**
 * Registers keyboard shortcuts that mirror common editor commands in Monaco.
 */
export function registerEditorCommands(
  editor: MonacoEditor,
  monaco: Monaco
): void {
  FORMAT_KEYBINDINGS.forEach((keybinding) => {
    registerFormatCommand(editor, createKeybinding(monaco, keybinding))
  })

  ACTION_COMMANDS.forEach(({ keybinding, action }) => {
    registerActionCommand(editor, createKeybinding(monaco, keybinding), action)
  })
}
