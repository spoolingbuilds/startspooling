'use client'

import React from 'react'
import { ErrorBoundaryState, createErrorState, generateErrorId, logError } from '@/lib/error-types'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const errorState = createErrorState(error)
  const errorId = generateErrorId()
  
  // Log the error
  React.useEffect(() => {
    logError(errorState, 'ErrorBoundary')
  }, [errorState])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Minimal Error Message */}
        <div className="space-y-4">
          <h1 className="text-2xl font-mono text-white">
            something broke.
          </h1>
          <p className="text-gray-400 text-sm">
            refresh to retry
          </p>
        </div>

        {/* Retry Button */}
        <button
          onClick={resetError}
          className="px-6 py-3 bg-transparent border border-[#FF0033] text-[#FF0033] hover:bg-[#FF0033] hover:text-white font-medium transition-colors duration-200"
        >
          retry
        </button>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorState = createErrorState(error)
    return {
      hasError: true,
      error: errorState,
      errorId: generateErrorId()
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorState = createErrorState(error)
    logError(errorState, 'ErrorBoundary')
    
    // Log additional error info in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return <FallbackComponent error={new Error(this.state.error?.message || 'Unknown error')} resetError={this.resetError} />
    }

    return this.props.children
  }
}
