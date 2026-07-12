import { loader } from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import * as monacoTypeScript from 'monaco-editor/esm/vs/language/typescript/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

const bundledMonaco = {
  ...monaco,
  typescript: monacoTypeScript,
}

let isMonacoConfigured = false
let monacoInitialization: ReturnType<typeof loader.init> | undefined

/**
 * Configures Monaco to load from bundled Vite assets instead of the default CDN loader.
 */
export function configureMonaco() {
  if (isMonacoConfigured) {
    return
  }

  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker()
      }

      return new editorWorker()
    },
  }

  loader.config({ monaco: bundledMonaco as unknown as Monaco })
  isMonacoConfigured = true
}

/**
 * Prepares Monaco before the React editor is mounted.
 *
 * The loader caches its initialization, so the editor can reuse this work when
 * it replaces the lightweight textarea.
 */
export function prepareMonaco() {
  configureMonaco()
  monacoInitialization ??= loader.init()

  return monacoInitialization
}
