'use client'

import React from 'react'
import { LoadingSpinnerProps } from '@/lib/error-types'

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
}

export default function LoadingSpinner({ 
  size = 'md', 
  label, 
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span 
        className={`text-[#00FFFF] ${textSizeClasses[size]} animate-pulse`}
        role="status"
        aria-label={label || 'Loading'}
        style={{
          animation: 'pulse 1s ease-in-out infinite'
        }}
      >
        {label || '...'}
      </span>
    </div>
  )
}
