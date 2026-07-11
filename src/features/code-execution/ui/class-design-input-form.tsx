import { type FormEvent, useState } from 'react'
import type { FunctionSignature } from '@/entities/code'
import { isError } from '@/shared/lib/guards'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Stack,
} from '@/shared/ui'
import {
  createClassDesignInput,
  isClassDesignArgs,
  isClassDesignOperations,
} from '../lib/class-design-input'

type ClassDesignInputFormProps = {
  signature: FunctionSignature
  onSubmit: (values: Record<string, unknown>) => void
}

export function ClassDesignInputForm({
  signature,
  onSubmit,
}: ClassDesignInputFormProps) {
  const [operationsText, setOperationsText] = useState(
    JSON.stringify([
      signature.name,
      ...(signature.methods?.map((method) => method.name) ?? []),
    ])
  )
  const [argsText, setArgsText] = useState('[[]]')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const operations = JSON.parse(operationsText)
      const args = JSON.parse(argsText)

      if (!isClassDesignOperations(operations)) {
        throw new Error('Operations must be a JSON string array.')
      }

      if (!isClassDesignArgs(args)) {
        throw new Error('Arguments must be a JSON array of argument arrays.')
      }

      if (operations.length !== args.length) {
        throw new Error('Operations and arguments must have the same length.')
      }

      if (operations[0] !== signature.name) {
        throw new Error(`First operation must be "${signature.name}".`)
      }

      setError(null)
      onSubmit(
        createClassDesignInput(
          signature.name,
          [...operations],
          args.map((item) => [...item])
        )
      )
    } catch (caughtError) {
      setError(
        isError(caughtError)
          ? caughtError.message
          : 'Invalid class design input.'
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Operations</CardTitle>
        <CardDescription>
          Enter LeetCode-style commands for{' '}
          <code className="font-mono">{signature.name}</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            <Stack spacing="xs">
              <Label htmlFor={`${signature.name}.operations`}>Operations</Label>
              <Input
                id={`${signature.name}.operations`}
                value={operationsText}
                onChange={(event) => setOperationsText(event.target.value)}
              />
            </Stack>
            <Stack spacing="xs">
              <Label htmlFor={`${signature.name}.args`}>Arguments</Label>
              <Input
                id={`${signature.name}.args`}
                value={argsText}
                onChange={(event) => setArgsText(event.target.value)}
              />
            </Stack>
            {signature.methods && signature.methods.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Methods:{' '}
                {signature.methods.map((method) => method.name).join(', ')}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Run
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}
