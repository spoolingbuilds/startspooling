'use client'

import { useEffect } from 'react'
import { analytics, useTimeTracking, useScrollTracking } from '@/lib/analytics'

interface PageAnalyticsProps {
  pageName: string
  path: string
}

export default function PageAnalytics({ pageName, path }: PageAnalyticsProps) {
  useEffect(() => {
    // Track page view
    analytics.page(path)
    analytics.funnelStep(pageName)
    
    // Track UTM parameters on landing page
    if (path === '/') {
      analytics.custom('landing_page_view')
    }
  }, [pageName, path])

  // Track time on page
  useTimeTracking(pageName)
  
  // Track scroll depth
  useScrollTracking(pageName)

  return null // This component doesn't render anything
}
