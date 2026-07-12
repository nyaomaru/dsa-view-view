/// <reference types="vite/client" />

declare module 'monaco-editor/esm/vs/editor/editor.api' {
  export * from 'monaco-editor'
}

declare module 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'

declare module 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'

declare module 'monaco-editor/esm/vs/language/typescript/monaco.contribution' {
  export const typescriptDefaults: import('@monaco-editor/react').Monaco['typescript']['typescriptDefaults']
  export const javascriptDefaults: import('@monaco-editor/react').Monaco['typescript']['javascriptDefaults']
}
