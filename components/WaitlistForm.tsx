'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useErrorHandling } from '@/lib/useErrorHandling'
import { useOfflineDetection } from '@/components/OfflineBanner'
import ErrorMessage from '@/components/ErrorMessage'
import LoadingSpinner from '@/components/LoadingSpinner'

interface WaitlistFormProps {
  className?: string
}

export default function WaitlistForm({ className }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false)
  const { isOffline } = useOfflineDetection()
  const { error, isLoading, setError, clearError, handleAsync } = useErrorHandling()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('required', 'validation')
      return
    }

    if (isOffline) {
      setError('you\'re offline', 'network')
      return
    }

    await handleAsync(
      async () => {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'something went wrong')
        }

        return data
      },
      {
        onSuccess: (data) => {
          setIsSuccess(true)
          setSuccessMessage(data.message || 'You\'re on the list!')
          setIsAlreadyVerified(data.alreadyVerified || false)
          setEmail('')
        },
        errorType: 'network'
      }
    )
  }

  if (isSuccess) {
    return (
      <div className={cn('text-center', className)}>
        <div className={cn(
          'border rounded-none p-6 mb-4 opacity-0 animate-fade-in',
          'bg-transparent border-[#00FFFF]'
        )}>
          <div className={cn(
            'text-lg font-mono mb-2 text-[#00FFFF]',
            'opacity-0 animate-fade-in'
          )}
          style={{
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
            animation: 'fadeIn 150ms ease-in-out forwards'
          }}>
            {isAlreadyVerified ? 'welcome back.' : 'you\'re in.'}
          </div>
          <p className={cn(
            'text-gray-400 text-sm'
          )}>
            {successMessage}
          </p>
        </div>
        {!isAlreadyVerified && (
          <a 
            href="/verify" 
            className="btn-danger inline-flex items-center px-6 py-3 font-semibold rounded-none transition-fast"
          >
            Verify Your Email
          </a>
        )}
      </div>
    )
  }

  return (
    <div className={cn('max-w-md mx-auto', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) clearError()
            }}
            placeholder="Enter your email"
            required
            className="input-field flex-1 disabled:opacity-50"
            disabled={isLoading || isOffline}
          />
          <button
            type="submit"
            disabled={isLoading || !email.trim() || isOffline}
            className="btn-danger whitespace-nowrap flex items-center justify-center min-w-[120px] disabled:bg-disabled disabled:text-text-muted"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Join Waitlist'
            )}
          </button>
        </div>
        
        {error && (
          <ErrorMessage
            message={error.message}
            type={error.type}
            onRetry={error.retryable ? () => handleSubmit({ preventDefault: () => {} } as React.FormEvent) : undefined}
            onDismiss={clearError}
            autoDismiss={error.type === 'validation'}
          />
        )}

        {isOffline && (
          <div className="text-[#FF0033] text-sm text-center">
            connection lost
          </div>
        )}
      </form>
      
      <p className="text-text-muted text-sm mt-4 text-center">
        Be the first to know when we launch. No spam, just pure automotive passion.
      </p>
    </div>
  )
}
