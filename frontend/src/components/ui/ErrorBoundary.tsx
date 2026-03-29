import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center p-4 bg-yellow-50">
            <div className="text-center bg-white rounded-2xl p-8 shadow max-w-sm w-full">
              <div className="text-5xl mb-4">😕</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Ups, da ist etwas schiefgelaufen</h2>
              <p className="text-gray-500 text-sm mb-6">
                Das Minispiel konnte nicht geladen werden. Bitte versuche es erneut.
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-6 py-3 bg-orange-400 text-white rounded-xl font-bold hover:bg-orange-500 active:bg-orange-600 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
