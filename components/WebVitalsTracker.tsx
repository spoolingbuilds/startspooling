'use client'

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/vitals'

export default function WebVitalsTracker() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals()
  }, [])

  return null // This component doesn't render anything
}
