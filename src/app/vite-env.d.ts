/// <reference types="vite/client" />

declare module 'monaco-editor/language/typescript/monaco.contribution' {
  export const typescriptDefaults: import('@monaco-editor/react').Monaco['typescript']['typescriptDefaults']
  export const javascriptDefaults: import('@monaco-editor/react').Monaco['typescript']['javascriptDefaults']
}
