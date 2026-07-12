import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/shared/ui/button'

type AppErrorBoundaryProps = {
  /** Application content guarded by the error boundary. */
  children: ReactNode
  /** Reload action used by the fallback. Defaults to reloading the current page. */
  onReload?: () => void
}

type AppErrorBoundaryState = {
  hasError: boolean
}

/**
 * Catches unexpected React render errors and keeps the app from becoming blank.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app error', error, errorInfo)
  }

  private handleReload = () => {
    if (this.props.onReload) {
      this.props.onReload()
      return
    }

    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <section className="pixel-panel w-full max-w-md border bg-card p-6 text-card-foreground shadow">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-lg font-semibold">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">
                  Reload the app and try the action again.
                </p>
              </div>
              <Button type="button" onClick={this.handleReload}>
                Reload
              </Button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
