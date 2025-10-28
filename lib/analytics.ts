'use client'

// Analytics utility for comprehensive event tracking
// Ready for GA4, Plausible, Mixpanel, or custom analytics integration

type AnalyticsEvent = {
  event: string
  properties?: Record<string, any>
  timestamp?: number
}

type UserProperties = {
  browser?: string
  device?: 'mobile' | 'tablet' | 'desktop'
  screenSize?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  sessionId?: string
  timestamp?: number
}

// Generate session ID
const generateSessionId = (): string => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Get or create session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Hash email for privacy
const hashEmail = (email: string): string => {
  // Simple hash function for privacy - in production, use crypto.subtle
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Get device type
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 640) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Get browser type
const getBrowser = (): string => {
  if (typeof window === 'undefined') return 'unknown'
  
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome')) return 'chrome'
  if (userAgent.includes('Firefox')) return 'firefox'
  if (userAgent.includes('Safari')) return 'safari'
  if (userAgent.includes('Edge')) return 'edge'
  return 'other'
}

// Capture UTM parameters
const captureUTMParams = (): { utmSource?: string; utmMedium?: string; utmCampaign?: string } => {
  if (typeof window === 'undefined') return {}
  
  const urlParams = new URLSearchParams(window.location.search)
  const utmSource = urlParams.get('utm_source')
  const utmMedium = urlParams.get('utm_medium')
  const utmCampaign = urlParams.get('utm_campaign')
  
  // Store in localStorage for persistence across pages
  if (utmSource) localStorage.setItem('utm_source', utmSource)
  if (utmMedium) localStorage.setItem('utm_medium', utmMedium)
  if (utmCampaign) localStorage.setItem('utm_campaign', utmCampaign)
  
  return {
    utmSource: utmSource || localStorage.getItem('utm_source') || undefined,
    utmMedium: utmMedium || localStorage.getItem('utm_medium') || undefined,
    utmCampaign: utmCampaign || localStorage.getItem('utm_campaign') || undefined
  }
}

// Get user properties
const getUserProperties = (): UserProperties => {
  const utmParams = captureUTMParams()
  
  return {
    browser: getBrowser(),
    device: getDeviceType(),
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    sessionId: getSessionId(),
    timestamp: Date.now(),
    ...utmParams
  }
}

// Main analytics object
export const analytics = {
  // Core tracking function
  track: (event: string, properties?: Record<string, any>) => {
    const userProps = getUserProperties()
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...userProps,
        ...properties,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      },
      timestamp: Date.now()
    }
    
    // In development: log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, eventData.properties)
    }
    
    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, eventData.properties)
      }
      
      // Custom backend fallback
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }).catch(console.error)
    } else {
      // Development: also send to GA4 for testing
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, eventData.properties)
      }
    }
  },

  // Page tracking
  page: (path: string) => {
    analytics.track('page_view', { path })
  },

  // Form interactions
  formStart: () => analytics.track('form_started'),
  formSubmit: (email: string) => analytics.track('form_submitted', { 
    emailHash: hashEmail(email.toLowerCase())
  }),
  formError: (error: string) => analytics.track('form_error', { error }),
  formSuccess: () => analytics.track('form_success'),

  // Verification events
  verifyPageView: () => analytics.track('verify_page_view'),
  codeEntry: (attempt: number) => analytics.track('code_entry', { attempt }),
  codeError: (attemptsLeft: number) => analytics.track('code_error', { attemptsLeft }),
  codeSuccess: () => analytics.track('code_success'),
  accountLocked: () => analytics.track('account_locked'),
  resendCode: () => analytics.track('resend_code'),
  codeExpired: () => analytics.track('code_expired'),

  // Welcome page
  welcomeView: (messageId: number) => analytics.track('welcome_view', { messageId }),
  welcomeScreenshot: () => analytics.track('welcome_screenshot'),

  // Engagement
  timeOnPage: (duration: number, page: string) => analytics.track('time_on_page', { duration, page }),
  scrollDepth: (percentage: number, page: string) => analytics.track('scroll_depth', { percentage, page }),
  buttonHover: (buttonName: string) => analytics.track('button_hover', { buttonName }),
  animationInteraction: () => analytics.track('animation_interaction'),

  // Drop-off points
  emailEntered: () => analytics.track('email_entered'),
  verifyAbandoned: (attemptsUsed: number) => analytics.track('verify_abandoned', { attemptsUsed }),

  // Conversion funnel
  funnelStep: (step: string, metadata?: Record<string, any>) => {
    analytics.track('funnel_step', { step, ...metadata })
  },

  // Email events
  confirmationEmailSent: (signupNumber: number, email: string) => {
    analytics.track('confirmation_email_sent', {
      signup_number: signupNumber,
      email_hash: hashEmail(email.toLowerCase()),
      timestamp: Date.now(),
    })
  },

  confirmationEmailFailed: (signupNumber: number, email: string, error: string) => {
    analytics.track('confirmation_email_failed', {
      signup_number: signupNumber,
      email_hash: hashEmail(email.toLowerCase()),
      error_type: error,
      timestamp: Date.now(),
    })
  },

  emailLinkClicked: (source: string) => {
    analytics.track('email_link_clicked', {
      email_source: source,
      timestamp: Date.now(),
    })
  },

  // Custom events
  custom: (eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, properties)
  }
}

// Funnel steps constants
export const FUNNEL_STEPS = {
  LANDING_VIEW: 'landing_view',
  FORM_FOCUS: 'form_focus',
  EMAIL_SUBMIT: 'email_submit',
  CODE_SENT: 'code_sent',
  VERIFY_VIEW: 'verify_view',
  CODE_ENTER: 'code_enter',
  VERIFICATION_SUCCESS: 'verification_success',
  WELCOME_VIEW: 'welcome_view',
  CONFIRMATION_EMAIL_SENT: 'confirmation_email_sent'
} as const

// Hook for tracking time on page
export const useTimeTracking = (pageName: string) => {
  if (typeof window === 'undefined') return

  const startTime = Date.now()
  
  const trackTime = () => {
    const duration = Date.now() - startTime
    analytics.timeOnPage(duration, pageName)
  }

  // Track time when page unloads
  window.addEventListener('beforeunload', trackTime)
  
  return () => {
    window.removeEventListener('beforeunload', trackTime)
    trackTime()
  }
}

// Hook for tracking scroll depth
export const useScrollTracking = (pageName: string) => {
  if (typeof window === 'undefined') return

  let maxScrollDepth = 0
  
  const trackScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercentage = Math.round((scrollTop / documentHeight) * 100)
    
    if (scrollPercentage > maxScrollDepth) {
      maxScrollDepth = scrollPercentage
      
      // Track at 25%, 50%, 75%, and 100%
      if ([25, 50, 75, 100].includes(scrollPercentage)) {
        analytics.scrollDepth(scrollPercentage, pageName)
      }
    }
  }

  window.addEventListener('scroll', trackScroll, { passive: true })
  
  return () => {
    window.removeEventListener('scroll', trackScroll)
  }
}

// Utility to add data attributes for future integration
export const addTrackingAttributes = (element: HTMLElement, eventName: string, properties?: Record<string, any>) => {
  element.setAttribute('data-track', eventName)
  if (properties) {
    element.setAttribute('data-track-props', JSON.stringify(properties))
  }
}

export default analytics
