'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useErrorHandling } from '@/lib/useErrorHandling'
import { useOfflineDetection } from '@/components/OfflineBanner'
import { analytics, FUNNEL_STEPS } from '@/lib/analytics'
import PageAnalytics from '@/components/PageAnalytics'

interface VerificationResponse {
  success: boolean
  verified?: boolean
  welcomeMessageId?: number
  attemptsRemaining?: number
  locked?: boolean
  lockTimeRemaining?: number
  message: string
}

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isOffline } = useOfflineDetection()
  const { error, isLoading, setError, clearError, handleAsync } = useErrorHandling()
  
  // Get email from query params or localStorage
  const emailFromQuery = searchParams.get('email')
  const [email, setEmail] = useState('')
  
  // Code state - array of 6 characters
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [attemptsRemaining, setAttemptsRemaining] = useState(4)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0)
  const [expiryTime, setExpiryTime] = useState<Date>(new Date(Date.now() + 15 * 60 * 1000))
  const [timeRemaining, setTimeRemaining] = useState(900) // 15 minutes in seconds
  const [isResending, setIsResending] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  // Refs for input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize email from query params or localStorage
  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery)
      localStorage.setItem('verificationEmail', emailFromQuery)
      // Set expiry time (15 minutes from now)
      const expiry = new Date(Date.now() + 15 * 60 * 1000)
      setExpiryTime(expiry)
      localStorage.setItem('verificationExpiry', expiry.toISOString())
    } else {
      const savedEmail = localStorage.getItem('verificationEmail')
      const savedExpiry = localStorage.getItem('verificationExpiry')
      if (savedEmail) {
        setEmail(savedEmail)
      }
      if (savedExpiry) {
        const expiry = new Date(savedExpiry)
        setExpiryTime(expiry)
        // Calculate time remaining
        const now = new Date()
        const diff = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000))
        setTimeRemaining(diff)
      }
    }
  }, [emailFromQuery])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Lock timer
  useEffect(() => {
    if (!isLocked || lockTimeRemaining <= 0) {
      return
    }

    const timer = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 1000) {
          setIsLocked(false)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLocked, lockTimeRemaining])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Format time remaining for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format lock time remaining
  const formatLockTime = (ms: number): string => {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Mask email for display
  const maskEmail = (email: string): string => {
    if (!email || !email.includes('@')) return email
    const [name, domain] = email.split('@')
    if (name.length <= 2) {
      return `${name[0]}****@starts*******.com`
    }
    return `te****@starts*******.com`
  }

  // Validate character input
  const isValidChar = (char: string): boolean => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return validChars.includes(char.toUpperCase())
  }

  // Handle code input change
  const handleCodeChange = (index: number, value: string) => {
    // Clear error state when user starts typing
    if (hasError) {
      setHasError(false)
    }
    
    // Only allow valid characters
    if (value && !isValidChar(value)) {
      return
    }

    const newCode = [...code]
    
    // Handle paste event
    if (value.length > 1) {
      const pastedValue = value.toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '').slice(0, 6)
      const newPastedCode = [...newCode]
      pastedValue.split('').forEach((char, i) => {
        if (index + i < 6) {
          newPastedCode[index + i] = char
        }
      })
      setCode(newPastedCode)
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newPastedCode.findIndex((c, i) => c === '' && i >= index)
      if (nextEmptyIndex >= 0) {
        inputRefs.current[nextEmptyIndex]?.focus()
      } else {
        inputRefs.current[5]?.focus()
      }
      return
    }

    // Handle single character input
    newCode[index] = value.toUpperCase()
    setCode(newCode)

    // Add micro-interaction animation
    if (value) {
      const inputElement = inputRefs.current[index]
      if (inputElement) {
        inputElement.classList.add('code-box-success')
        setTimeout(() => {
          inputElement.classList.remove('code-box-success')
        }, 200)
      }
    }

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace to go to previous input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Check if code is complete
  const isCodeComplete = code.every(c => c !== '')

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isCodeComplete || isLoading || isLocked || timeRemaining <= 0 || isOffline) {
      return
    }

    const fullCode = code.join('')
    
    // Track code entry attempt
    analytics.codeEntry(4 - attemptsRemaining + 1)
    analytics.funnelStep(FUNNEL_STEPS.CODE_ENTER, { attempt: 4 - attemptsRemaining + 1 })

    console.log('[Verify] Submitting verification:', { 
      email, 
      code: fullCode, 
      maskedEmail: maskEmail(email) 
    })

    await handleAsync(
      async () => {
        try {
          const response = await fetch('/api/verify-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code: fullCode }),
          })

          let data: VerificationResponse
          try {
            data = await response.json()
          } catch (jsonError) {
            console.error('[Verify] Failed to parse JSON:', jsonError)
            throw new Error('Server returned invalid response')
          }

          if (!response.ok) {
            // Handle "Already verified" case specially
            if (data.message === 'Already verified') {
              // Redirect to welcome page with a default message ID
              router.prefetch('/welcome?id=1')
              localStorage.removeItem('verificationEmail')
              localStorage.removeItem('verificationExpiry')
              router.push('/welcome?id=1')
              return data
            }
            throw new Error(data.message || 'verification failed')
          }

          if (!data.verified || !data.welcomeMessageId) {
            throw new Error(data.message || 'verification failed')
          }

          return data
        } catch (fetchError) {
          // Handle network errors
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            throw new Error('Network error. Check your connection.')
          }
          throw fetchError
        }
      },
      {
        onSuccess: (data) => {
          // Prefetch the welcome page for better performance
          router.prefetch('/welcome')
          
          // Track success
          analytics.codeSuccess()
          analytics.funnelStep(FUNNEL_STEPS.VERIFICATION_SUCCESS)
          
          // Store email in session storage for welcome page
          sessionStorage.setItem('userEmail', email)
          
          // Success - redirect to welcome page
          localStorage.removeItem('verificationEmail')
          localStorage.removeItem('verificationExpiry')
          router.push('/welcome')
        },
        onError: (errorState) => {
          // Handle specific error cases
          if (errorState.message.includes('locked')) {
            setIsLocked(true)
            setLockTimeRemaining(3600000) // 1 hour
            setHasError(true)
            analytics.accountLocked()
          } else if (errorState.message.includes('attempts')) {
            setAttemptsRemaining(prev => Math.max(0, prev - 1))
            setHasError(true)
            analytics.codeError(attemptsRemaining - 1)
            // Clear code
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
          } else if (errorState.message.includes('expired')) {
            setHasError(true)
            setTimeRemaining(0)
            analytics.codeExpired()
          } else {
            setHasError(true)
            analytics.codeError(attemptsRemaining)
          }
        },
        errorType: 'server'
      }
    )
  }

  // Handle resend code
  const handleResendCode = async () => {
    if (!email || isResending || isOffline) {
      return
    }

    console.log('[Resend] Requesting resend for email:', { email, maskedEmail: maskEmail(email) })

    setIsResending(true)
    setHasError(false)
    
    // Track resend code
    analytics.resendCode()

    await handleAsync(
      async () => {
        try {
          const response = await fetch('/api/resend-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })

          let data
          try {
            data = await response.json()
          } catch (jsonError) {
            console.error('[Resend] Failed to parse JSON:', jsonError)
            throw new Error('Server returned invalid response')
          }

          if (!response.ok) {
            throw new Error(data.message || 'failed to resend code')
          }

          return data
        } catch (fetchError) {
          // Handle network errors
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            throw new Error('Network error. Check your connection.')
          }
          throw fetchError
        }
      },
      {
        onSuccess: () => {
          // Reset timer to 15 minutes
          const newExpiry = new Date(Date.now() + 15 * 60 * 1000)
          setExpiryTime(newExpiry)
          setTimeRemaining(900)
          localStorage.setItem('verificationExpiry', newExpiry.toISOString())
          // Clear code
          setCode(['', '', '', '', '', ''])
          inputRefs.current[0]?.focus()
        },
        onError: (errorState) => {
          setHasError(true)
        },
        errorType: 'network'
      }
    ).finally(() => {
      setIsResending(false)
    })
  }

  return (
    <>
      <PageAnalytics pageName="verify" path="/verify" />
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-sm text-gray-500 mb-4">second gate</h1>
            {email && (
              <p className="text-xs text-gray-600">
                sent to: {maskEmail(email)}
              </p>
            )}
          </div>

          {/* Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6 Code Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLocked || timeRemaining <= 0 || isLoading || isOffline}
                  className={cn(
                    'w-16 h-16 sm:w-20 sm:h-20 text-center text-2xl sm:text-3xl font-mono text-white',
                    'bg-transparent border-2 border-[#333333] rounded-none',
                    'focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_#00FFFF]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200',
                    'code-box-micro',
                    hasError && 'code-box-error'
                  )}
                  data-track="verify-code-entry"
                  data-track-props={JSON.stringify({ position: index + 1 })}
                />
              ))}
            </div>

            {/* Countdown Timer */}
            <div className="text-center">
              <p className={cn(
                'font-mono text-xl sm:text-2xl font-bold',
                timeRemaining <= 300 ? 'text-[#FF0033]' : 'text-[#00FFFF]'
              )}>
                {formatTime(timeRemaining)}
              </p>
            </div>

            {/* Attempts Remaining */}
            {attemptsRemaining < 4 && attemptsRemaining > 0 && (
              <div className="text-center">
                <p className="text-sm text-[#FF0033]">
                  {attemptsRemaining} attempts left
                </p>
              </div>
            )}

            {/* Error Messages */}
            {hasError && (
              <div className="text-center">
                {isLocked ? (
                  <div>
                    <p className="text-[#FF0033] text-sm mb-2">locked.</p>
                    <p className="text-[#FF0033] font-mono text-lg">
                      {formatLockTime(lockTimeRemaining)}
                    </p>
                  </div>
                ) : timeRemaining <= 0 ? (
                  <p className="text-[#FF0033] text-sm">expired.</p>
                ) : attemptsRemaining === 1 ? (
                  <p className="text-[#FF0033] text-sm">final attempt.</p>
                ) : (
                  <p className="text-[#FF0033] text-sm">incorrect.</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isCodeComplete || isLoading || isLocked || timeRemaining <= 0 || isOffline}
              className={cn(
                'w-full py-4 px-6 font-bold uppercase text-sm',
                'bg-transparent border border-[#00FFFF] text-[#00FFFF] rounded-none',
                'hover:bg-[#FF0033] hover:border-[#FF0033] hover:text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#00FFFF] disabled:hover:text-[#00FFFF]',
                'transition-all duration-200',
                'btn-micro',
                'min-h-[44px]' // Touch target minimum
              )}
              data-track="verify-submit"
            >
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                'enter'
              )}
            </button>

            {/* Resend Link */}
            {!isLocked && timeRemaining > 0 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending || isOffline}
                  className={cn(
                    'text-xs text-[#666666] hover:underline',
                    'transition-colors duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  data-track="resend-code"
                >
                  {isResending ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    'resend'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
        </div>
      </div>
    </>
  )
}
