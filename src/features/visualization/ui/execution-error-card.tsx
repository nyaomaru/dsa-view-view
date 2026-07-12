import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'

/**
 * Props for ExecutionErrorCard component.
 */
type ExecutionErrorCardProps = {
  /** Execution error or warning message to display. */
  error: string
}

export function ExecutionErrorCard({ error }: ExecutionErrorCardProps) {
  const isTruncation = error.includes('truncated')
  const warningClassName = 'text-warning'

  return (
    <Card className={isTruncation ? 'border-warning' : 'border-destructive'}>
      <CardHeader>
        <CardTitle
          className={isTruncation ? warningClassName : 'text-destructive'}
        >
          {isTruncation ? 'Execution Warning' : 'Execution Error'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-sm ${isTruncation ? warningClassName : 'text-destructive'}`}
        >
          {error}
        </p>
      </CardContent>
    </Card>
  )
}
