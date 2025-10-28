'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ErrorMessageProps, ErrorType } from '@/lib/error-types'

// Minimal cryptic error messages
const getCrypticMessage = (originalMessage: string, type: ErrorType): string => {
  const lowerMessage = originalMessage.toLowerCase()
  
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return 'connection failed. retry?'
  }
  if (lowerMessage.includes('timeout')) {
    return 'timed out. retry?'
  }
  if (lowerMessage.includes('server') || lowerMessage.includes('internal')) {
    return 'something broke. our fault.'
  }
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
    return 'slow down.'
  }
  if (lowerMessage.includes('already') || lowerMessage.includes('exists')) {
    return 'already registered'
  }
  if (lowerMessage.includes('invalid') || lowerMessage.includes('format')) {
    return 'invalid format'
  }
  if (lowerMessage.includes('required') || lowerMessage.includes('empty')) {
    return 'required'
  }
  if (lowerMessage.includes('too long') || lowerMessage.includes('length')) {
    return 'too long'
  }
  
  // Default cryptic message
  return 'error.'
}

export default function ErrorMessage({
  message,
  type = 'unknown',
  onRetry,
  onDismiss,
  autoDismiss = false,
  dismissAfter = 5000,
  className = ''
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 100) // Faster animation
  }, [onDismiss])

  // Auto-dismiss functionality
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, dismissAfter)
      
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismiss, dismissAfter, handleDismiss])

  const handleRetry = () => {
    onRetry?.()
  }

  if (!isVisible) return null

  const crypticMessage = getCrypticMessage(message, type)

  return (
    <div 
      className={`
        text-[#FF0033] text-sm opacity-0 animate-fade-in
        ${isAnimating ? 'animate-fade-out' : ''}
        ${className}
      `}
      role="alert"
      aria-live="polite"
      style={{
        animation: 'fadeIn 100ms ease-in-out forwards'
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#FF0033] text-sm">
          {crypticMessage}
        </span>
        
        {onRetry && (
          <button
            onClick={handleRetry}
            className="text-[#FF0033] text-xs underline hover:no-underline ml-2 transition-all duration-150"
            aria-label="Retry action"
          >
            retry
          </button>
        )}
      </div>
    </div>
  )
}