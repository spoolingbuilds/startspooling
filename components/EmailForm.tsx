'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useErrorHandling } from '@/lib/useErrorHandling'
import { useOfflineDetection } from '@/components/OfflineBanner'
import ErrorMessage from '@/components/ErrorMessage'
import LoadingSpinner from '@/components/LoadingSpinner'
import { analytics, FUNNEL_STEPS } from '@/lib/analytics'

interface EmailFormProps {
  className?: string
}

export default function EmailForm({ className = '' }: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false)
  const { isOffline } = useOfflineDetection()
  const { error, isLoading, setError, clearError, handleAsync } = useErrorHandling()
  const router = useRouter()

  // Track email link clicks from confirmation emails
  useEffect(() => {
    // Check if user came from confirmation email
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    
    if (utmSource === 'confirmation_email') {
      analytics.emailLinkClicked('confirmation_email')
    }
  }, [])

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('required', 'validation')
      analytics.formError('required')
      return
    }
    
    if (!isValidEmail(email)) {
      setError('invalid format', 'validation')
      analytics.formError('invalid_format')
      return
    }

    if (isOffline) {
      setError('you\'re offline', 'network')
      analytics.formError('offline')
      return
    }

    // Track form submission
    analytics.formSubmit(email)
    analytics.funnelStep(FUNNEL_STEPS.EMAIL_SUBMIT, { emailHash: email.toLowerCase().replace(/(.{2}).*(@.*)/, '$1***$2') })

    await handleAsync(
      async () => {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim() }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'something went wrong')
        }

        if (!data.success) {
          throw new Error(data.error || 'something went wrong')
        }

        return data
      },
      {
        onSuccess: (data) => {
          setSuccess(true)
          setSuccessMessage(data.message || 'Code sent!')
          setIsAlreadyVerified(data.alreadyVerified || false)
          
          // Track success
          analytics.formSuccess()
          analytics.funnelStep(FUNNEL_STEPS.CODE_SENT)
          
          // Redirect to verification page for both new and already verified users
          // Already verified users get a new code and can still verify
          setTimeout(() => {
            // Use the actual email that was submitted
            const actualEmail = email.trim().toLowerCase()
            router.push(`/verify?email=${encodeURIComponent(actualEmail)}`)
          }, 2500)
        },
        errorType: 'network'
      }
    )
  }

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  if (success) {
    // Different messages for already verified vs new users
    const crypticMessages = isAlreadyVerified ? [
      "you're already in. but we sent another code anyway.",
      "already verified. but check your email.",
      "you've been here before. code sent.",
      "access: granted. but we sent another code.",
      "we remember you. code sent anyway.",
      "you're on the list. but here's another code.",
      "already verified. but we're sending another.",
      "you've got access. but check your email."
    ] : [
      "check your email. you have 15 minutes.",
      "code sent. clock started.",
      "boost pressure building. check your email.",
      "first gate: your email. check it."
    ]
    
    const randomMessage = crypticMessages[Math.floor(Math.random() * crypticMessages.length)]
    
    return (
      <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 page-fade-in ${className}`}>
        <div 
          className="text-[#00FFFF] text-center text-glow"
          style={{
            fontSize: '2rem',
            lineHeight: '1.6',
            textShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
            animation: 'fadeInUp 500ms ease-out forwards'
          }}
        >
          {randomMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-md mx-auto">
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (e.target.value.trim()) {
                analytics.emailEntered()
              }
            }}
            placeholder="your email"
            disabled={isLoading || isOffline}
            className={`input-micro ${error ? 'input-error' : ''}`}
            data-track="email-input"
            aria-label="email address"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #333',
              color: 'white',
              padding: '12px 0',
              fontSize: '1rem',
              fontFamily: 'monospace',
              width: '100%',
              outline: 'none',
              borderRadius: '0',
              minHeight: '44px' // Touch target minimum
            }}
            onFocus={(e) => {
              e.target.style.borderBottom = '1px solid #00FFFF'
              e.target.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)'
              analytics.formStart()
              analytics.funnelStep(FUNNEL_STEPS.FORM_FOCUS)
            }}
            onBlur={(e) => {
              e.target.style.borderBottom = '1px solid #333'
              e.target.style.boxShadow = 'none'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !isValidEmail(email) || isOffline}
            className="btn-micro"
            data-track="form-submit"
            style={{
              background: 'transparent',
              border: isLoading || !email.trim() || !isValidEmail(email) || isOffline ? '1px solid #333333' : '1px solid #00FFFF',
              color: isLoading || !email.trim() || !isValidEmail(email) || isOffline ? '#333333' : '#00FFFF',
              padding: '14px 24px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderRadius: '0',
              cursor: isLoading || !email.trim() || !isValidEmail(email) || isOffline ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '120px',
              minHeight: '44px', // Touch target minimum
              opacity: isLoading || !email.trim() || !isValidEmail(email) || isOffline ? 0.5 : 1,
              boxShadow: isLoading ? '0 0 15px rgba(0, 255, 255, 0.6)' : 'none',
              width: '100%' // Full width on mobile
            }}
            onMouseEnter={(e) => {
              if (!isLoading && email.trim() && isValidEmail(email) && !isOffline) {
                e.currentTarget.style.background = '#00FFFF'
                e.currentTarget.style.color = 'black'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && email.trim() && isValidEmail(email) && !isOffline) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#00FFFF'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              'prove it'
            )}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="max-w-md mx-auto">
          <ErrorMessage
            message={error.message}
            type={error.type}
            onRetry={error.retryable ? () => handleSubmit(new Event('submit') as any) : undefined}
            onDismiss={clearError}
            autoDismiss={error.type === 'validation'}
          />
        </div>
      )}

      {isOffline && (
        <div className="text-center max-w-md mx-auto">
          <div className="text-[#FF0033] text-sm">
            connection lost
          </div>
        </div>
      )}
    </div>
  )
}
