import { Alert, AlertDescription } from '@/shared/ui'
import type { CompilationError, CompilationResult } from '@/entities/code'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'

/**
 * Props for CompilationPanel component.
 */
type CompilationPanelProps = {
  /** Compilation result produced by the active language adapter. */
  result: CompilationResult | null
  /** Lint errors reported by the editor. */
  lintErrors: CompilationError[]
}

/**
 * Displays compilation status and errors
 *
 * Shows compilation success/failure status and any errors or warnings.
 *
 * @param props - Component props
 * @returns CompilationPanel component
 */
export function CompilationPanel({
  result,
  lintErrors,
}: CompilationPanelProps) {
  // Combine compilation errors and lint errors
  const allErrors = [...(result?.errors ?? []), ...lintErrors]

  // Show success message if compiled successfully
  if (result?.success && allErrors.length === 0) {
    return (
      <div className="space-y-3">
        <Alert className="border-primary">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-none text-primary" />
            <AlertDescription className="text-primary leading-none">
              Compilation successful! Ready for verification.
            </AlertDescription>
          </div>
        </Alert>
      </div>
    )
  }

  // Show errors if any
  if (allErrors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No errors detected. Click Compile to proceed.
      </div>
    )
  }

  const errorCount = allErrors.filter((e) => e.severity === 'error').length
  const warningCount = allErrors.filter((e) => e.severity === 'warning').length

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex-none text-sm font-medium">
        {errorCount > 0 && (
          <span className="text-destructive">
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        )}
        {errorCount > 0 && warningCount > 0 && <span className="mx-2">•</span>}
        {warningCount > 0 && (
          <span className="text-warning">
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {allErrors.map((error, index) => (
          <Alert
            key={index}
            variant={error.severity === 'error' ? 'destructive' : 'default'}
            className={error.severity === 'warning' ? 'border-warning' : ''}
          >
            {error.severity === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            <AlertDescription>
              <span className="font-mono text-xs">
                Line {error.line}:{error.column}
              </span>
              {' - '}
              {error.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  )
}
