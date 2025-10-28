'use client'

import { useState, useCallback } from 'react'
import { ErrorState, ErrorType, createErrorState, logError } from '@/lib/error-types'

export interface UseErrorHandlingReturn {
  error: ErrorState | null
  isLoading: boolean
  setError: (error: Error | string, type?: ErrorType) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  handleAsync: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: ErrorState) => void
      errorType?: ErrorType
    }
  ) => Promise<T | null>
}

export function useErrorHandling(): UseErrorHandlingReturn {
  const [error, setErrorState] = useState<ErrorState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const setError = useCallback((error: Error | string, type: ErrorType = 'unknown') => {
    const errorState = typeof error === 'string' 
      ? { type, message: error, retryable: false, timestamp: Date.now() }
      : createErrorState(error, type)
    
    setErrorState(errorState)
    logError(errorState, 'useErrorHandling')
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: ErrorState) => void
      errorType?: ErrorType
    }
  ): Promise<T | null> => {
    setIsLoading(true)
    clearError()

    try {
      const result = await asyncFn()
      options?.onSuccess?.(result)
      return result
    } catch (err) {
      const errorState = createErrorState(
        err instanceof Error ? err : new Error(String(err)),
        options?.errorType || 'unknown'
      )
      
      setErrorState(errorState)
      logError(errorState, 'handleAsync')
      options?.onError?.(errorState)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [clearError])

  return {
    error,
    isLoading,
    setError,
    clearError,
    setLoading,
    handleAsync
  }
}
