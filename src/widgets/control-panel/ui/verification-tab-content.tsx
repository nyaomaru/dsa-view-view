import { lazy, Suspense } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Paragraph,
  Stack,
} from '@/shared/ui'
import type { VerificationTabContentProps } from '../model/types'

const InputForm = lazy(() =>
  import('@/features/code-execution/input-form').then((module) => ({
    default: module.InputForm,
  }))
)

export function VerificationTabContent({
  functionSignature,
  defaultInputValues,
  onRunCode,
  onVerificationInputChange,
}: VerificationTabContentProps) {
  if (functionSignature) {
    return (
      <Suspense fallback={null}>
        <InputForm
          signature={functionSignature}
          defaultInputValues={defaultInputValues}
          onSubmit={onRunCode}
          onRawInputChange={onVerificationInputChange}
        />
      </Suspense>
    )
  }

  return (
    <Card className="bg-background/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Run Script</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack spacing="md">
          <Paragraph variant="muted">
            No specific function signature detected. Run the script directly?
          </Paragraph>
          <Button onClick={() => onRunCode({})} className="w-full">
            Run Now
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
