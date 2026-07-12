import type { Monaco } from '@monaco-editor/react'

/**
 * Monaco document-formatting provider contract for the current editor build.
 */
type FormattingProvider = Parameters<
  Monaco['languages']['registerDocumentFormattingEditProvider']
>[1]
/**
 * Monaco text model passed into a document-formatting provider.
 */
type MonacoTextModel = Parameters<
  NonNullable<FormattingProvider['provideDocumentFormattingEdits']>
>[0]
type FormattingDisposable = ReturnType<
  Monaco['languages']['registerDocumentFormattingEditProvider']
>

const FORMATTED_LANGUAGES = ['typescript', 'javascript'] as const
const PRETTIER_FORMAT_OPTIONS = {
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 80,
} as const

const formatCode = async (text: string): Promise<string> => {
  const [prettier, parserTypeScript, parserEstree] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/typescript'),
    import('prettier/plugins/estree'),
  ])

  return prettier.format(text, {
    ...PRETTIER_FORMAT_OPTIONS,
    plugins: [parserTypeScript, parserEstree],
  })
}

const disposeAll = (disposables: FormattingDisposable[]): void => {
  disposables.forEach((disposable) => disposable.dispose())
}

/**
 * Registers Prettier-backed document formatting for TypeScript and JavaScript.
 */
export function registerFormattingProvider(monaco: Monaco): () => void {
  const formattingProvider: FormattingProvider = {
    async provideDocumentFormattingEdits(model: MonacoTextModel) {
      const text = model.getValue()

      try {
        const formatted = await formatCode(text)

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ]
      } catch (error) {
        console.error('Prettier formatting failed:', error)
        return []
      }
    },
  }

  const disposables = FORMATTED_LANGUAGES.map((language) =>
    monaco.languages.registerDocumentFormattingEditProvider(
      language,
      formattingProvider
    )
  )

  return () => {
    disposeAll(disposables)
  }
}
