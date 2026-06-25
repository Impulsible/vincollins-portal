'use client'

import { Component, ReactNode } from 'react'
import { RefreshCw, AlertTriangle, Home, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  // Which portal context we're in — affects styling
  variant?: 'default' | 'staff' | 'student' | 'admin'
  // If true, show a minimal inline error instead of full screen
  inline?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  showDetails: boolean
  retryCount: number
}

const MAX_RETRIES = 3

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production you'd send this to Sentry / LogRocket / etc.
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)

    this.setState({ errorInfo: info.componentStack })

    // Report to your logging service here
    // e.g. Sentry.captureException(error, { extra: info })
  }

  handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      window.location.reload()
      return
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: prev.retryCount + 1,
    }))
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  render() {
    const { hasError, error, errorInfo, showDetails, retryCount } = this.state
    const { children, fallback, inline } = this.props

    if (!hasError) return children
    if (fallback) return fallback

    // ── Inline variant (for widget-level errors) ──────────────────────────────
    if (inline) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-700 mb-1">
            This section failed to load
          </p>
          <p className="text-xs text-red-500 mb-3">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs font-semibold text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )
    }

    // ── Full screen variant ───────────────────────────────────────────────────
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            {/* Top bar */}
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />

            <div className="p-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>

              <p className="text-sm text-gray-500 mb-1">
                {error?.message || 'An unexpected error occurred'}
              </p>

              {retryCount > 0 && (
                <p className="text-xs text-amber-600 font-medium mt-1">
                  Retry attempt {retryCount} of {MAX_RETRIES}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-8">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0A2472] text-white rounded-xl font-semibold text-sm hover:bg-[#1e3a8a] transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryCount >= MAX_RETRIES ? 'Reload Page' : 'Try Again'}
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </button>
              </div>

              {/* Error details (collapsed by default) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 text-left">
                  <button
                    onClick={this.toggleDetails}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full"
                  >
                    {showDetails
                      ? <ChevronUp className="h-3.5 w-3.5" />
                      : <ChevronDown className="h-3.5 w-3.5" />
                    }
                    {showDetails ? 'Hide' : 'Show'} error details
                  </button>

                  {showDetails && (
                    <div className="mt-3 p-3 bg-gray-900 rounded-lg overflow-auto max-h-48">
                      <pre className="text-[10px] text-red-400 whitespace-pre-wrap font-mono">
                        {error?.stack}
                        {errorInfo && `\n\nComponent Stack:${errorInfo}`}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Vincollins College Portal — If this keeps happening,{' '}
            <a href="/contact" className="underline hover:text-gray-600">
              contact support
            </a>
          </p>
        </div>
      </div>
    )
  }
}

// ── Convenience wrapper for functional components ─────────────────────────────
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: { inline?: boolean; variant?: Props['variant'] }
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary inline={options?.inline} variant={options?.variant}>
      <Component {...props} />
    </ErrorBoundary>
  )
  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return Wrapped
}