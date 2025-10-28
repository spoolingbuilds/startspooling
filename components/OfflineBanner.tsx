'use client'

import React, { useState, useEffect } from 'react'
import { OfflineState } from '@/lib/error-types'

export function useOfflineDetection(): OfflineState {
  const [isOffline, setIsOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Check initial online status
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      setWasOffline(true)
      // Reset wasOffline after a delay
      setTimeout(() => setWasOffline(false), 3000)
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOffline, wasOffline }
}

interface OfflineBannerProps {
  className?: string
}

export default function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const { isOffline, wasOffline } = useOfflineDetection()

  if (!isOffline && !wasOffline) return null

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium
        ${isOffline 
          ? 'bg-red-500 text-white animate-slide-in' 
          : 'bg-green-500 text-white animate-slide-in'
        }
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {isOffline ? (
        <span>you&apos;re offline</span>
      ) : (
        <span>you&apos;re back online</span>
      )}
    </div>
  )
}
