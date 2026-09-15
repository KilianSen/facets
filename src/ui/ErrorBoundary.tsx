import { Component, type ErrorInfo, type ReactNode } from 'react'
import { btnGhost, btnPrimary, card, eyebrow } from './styles'

const isDev = Boolean(import.meta.env?.DEV)

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (isDev) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  private handleReset = (): void => {
    try {
      localStorage.removeItem('fptic.quiz.v1')
      localStorage.removeItem('fptic.result.v1')
      localStorage.removeItem('fptic.compare.v1')
    } catch { /* ignore */ }
    window.location.href = '/'
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen w-full bg-paper px-4 py-16 text-ink flex items-center justify-center">
          <div className={`${card} max-w-md w-full p-6 text-center flex flex-col items-center gap-4`}>
            <p className={eyebrow}>unexpected error</p>
            <h1 className="font-serif text-3xl font-bold leading-tight">Something went sideways.</h1>
            <p className="text-sm text-ink-soft leading-relaxed">
              An unexpected error occurred while rendering. You can try refreshing the page, or reset your saved run to start fresh.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className={btnPrimary}
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className={btnGhost}
              >
                Reset & restart
              </button>
            </div>
            {this.state.error && isDev && (
              <details className="mt-4 text-left w-full border-t border-ink/10 pt-3 text-xs font-mono text-ink-faint break-all">
                <summary className="cursor-pointer font-sans hover:text-ink">Error details</summary>
                <pre className="mt-2 p-2 bg-paper-deep rounded overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
