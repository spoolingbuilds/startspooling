// Error handling types and utilities

export type ErrorType = 
  | 'network'
  | 'timeout'
  | 'validation'
  | 'server'
  | 'client'
  | 'unknown'

export interface ErrorState {
  type: ErrorType
  message: string
  code?: string | number
  retryable: boolean
  timestamp: number
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: ErrorState | null
  errorId: string
}

export interface ErrorMessageProps {
  message: string
  type?: ErrorType
  onRetry?: () => void
  onDismiss?: () => void
  autoDismiss?: boolean
  dismissAfter?: number
  className?: string
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export interface OfflineState {
  isOffline: boolean
  wasOffline: boolean
}

// Error message mappings for user-friendly display
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'connection issue.',
  timeout: 'taking too long. retry?',
  validation: 'invalid input.',
  server: 'server error. try again.',
  client: 'something broke. we\'re on it.',
  unknown: 'something went wrong.'
}

// Generate unique error ID for tracking
export const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create error state from Error object
export const createErrorState = (error: Error, type: ErrorType = 'unknown'): ErrorState => {
  // Use the error's message if it exists and is meaningful, otherwise use the mapped message
  const errorMessage = error.message || ERROR_MESSAGES[type]
  const shouldUseErrorMessage = error.message && 
    !errorMessage.includes('Error') && 
    !errorMessage.includes('Failed') &&
    errorMessage.length > 5 // Only if it's a meaningful message
  
  return {
    type,
    message: shouldUseErrorMessage ? errorMessage : ERROR_MESSAGES[type],
    code: 'code' in error ? (error as any).code : undefined,
    retryable: type === 'network' || type === 'timeout' || type === 'server',
    timestamp: Date.now()
  }
}

// Log error for debugging
export const logError = (error: ErrorState, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${error.type.toUpperCase()}] ${context || 'Error'}:`, {
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      errorId: error.timestamp
    })
  }
  // In production, you would send to error tracking service
  // Example: Sentry.captureException(error)
}
