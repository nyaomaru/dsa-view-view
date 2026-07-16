import { CompilationPanel } from '@/features/compilation'
import { Button, Heading, Label, Stack } from '@/shared/ui'
import type { EditorTabContentProps } from '../model/types'
import { ExampleCombobox } from './example-combobox'

export function EditorTabContent({
  algorithmExamples,
  selectedExampleId,
  lintErrors,
  compilationResult,
  onExampleChange,
  onCompile,
}: EditorTabContentProps) {
  const hasLintErrors = lintErrors.some(
    (lintError) => lintError.severity === 'error'
  )

  return (
    <div className="flex h-auto flex-col p-6 lg:h-full">
      <div className="flex-none mb-6 space-y-4">
        <Stack spacing="xs">
          <Label htmlFor="algorithm-example" className="mb-1 block">
            Example
          </Label>
          <ExampleCombobox
            examples={algorithmExamples}
            selectedExampleId={selectedExampleId}
            onExampleChange={onExampleChange}
          />
        </Stack>
        <Button
          onClick={onCompile}
          disabled={hasLintErrors}
          className="w-full shadow-lg hover:shadow-xl transition-all h-11 text-base font-semibold"
        >
          Compile Code
        </Button>
        <Heading level={3} className="text-xl">
          Compilation Status
        </Heading>
      </div>
      <div className="flex-1 min-h-0">
        <CompilationPanel result={compilationResult} lintErrors={lintErrors} />
      </div>
    </div>
  )
}
