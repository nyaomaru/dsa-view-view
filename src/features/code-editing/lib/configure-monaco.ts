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

/**
 * Configures Monaco to load from bundled Vite assets instead of the default CDN loader.
 */
export function configureMonaco() {
  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker()
      }

      return new editorWorker()
    },
  }

  loader.config({ monaco: bundledMonaco as unknown as Monaco })
}
