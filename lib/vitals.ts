import { Metric } from 'web-vitals'

export type VitalsMetric = Metric & {
  // Additional metadata
  url?: string
  timestamp?: number
}

/**
 * Send Web Vitals metrics to analytics
 */
export function reportWebVitals(metric: Metric) {
  const { name, value, id, delta, rating, entries } = metric

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', {
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      rating,
      delta,
      entries,
    })
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_category: 'Web Vitals',
        event_label: id,
        non_interaction: true,
      })
    }

    // Custom endpoint
    fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        rating,
        delta,
        url: window.location.href,
      }),
    }).catch(console.error)
  } else {
    // Development: also send to GA4 for testing
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_category: 'Web Vitals',
        event_label: id,
        non_interaction: true,
      })
    }
  }
}

/**
 * Get CLS value from a metric
 */
export function getCLS(onPerfEntry?: (metric: Metric) => void) {
  const reportVital = onPerfEntry || reportWebVitals
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      import('web-vitals').then(({ onCLS }) => {
        onCLS(reportVital)
      })
    } catch (error) {
      console.warn('Failed to load CLS metric:', error)
    }
  }
}

/**
 * Get FID value from a metric
 */
export function getFID(onPerfEntry?: (metric: Metric) => void) {
  const reportVital = onPerfEntry || reportWebVitals
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      import('web-vitals').then(({ onFID }) => {
        onFID(reportVital)
      })
    } catch (error) {
      console.warn('Failed to load FID metric:', error)
    }
  }
}

/**
 * Get FCP value from a metric
 */
export function getFCP(onPerfEntry?: (metric: Metric) => void) {
  const reportVital = onPerfEntry || reportWebVitals
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      import('web-vitals').then(({ onFCP }) => {
        onFCP(reportVital)
      })
    } catch (error) {
      console.warn('Failed to load FCP metric:', error)
    }
  }
}

/**
 * Get LCP value from a metric
 */
export function getLCP(onPerfEntry?: (metric: Metric) => void) {
  const reportVital = onPerfEntry || reportWebVitals
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      import('web-vitals').then(({ onLCP }) => {
        onLCP(reportVital)
      })
    } catch (error) {
      console.warn('Failed to load LCP metric:', error)
    }
  }
}

/**
 * Get TTFB value from a metric
 */
export function getTTFB(onPerfEntry?: (metric: Metric) => void) {
  const reportVital = onPerfEntry || reportWebVitals
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      import('web-vitals').then(({ onTTFB }) => {
        onTTFB(reportVital)
      })
    } catch (error) {
      console.warn('Failed to load TTFB metric:', error)
    }
  }
}

/**
 * Get INP value from a metric
 */
export function getINP(onPerfEntry?: (metric: Metric) => void) {
  const reportVital = onPerfEntry || reportWebVitals
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      import('web-vitals').then(({ onINP }) => {
        onINP(reportVital)
      })
    } catch (error) {
      console.warn('Failed to load INP metric:', error)
    }
  }
}

/**
 * Initialize all Web Vitals tracking
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Track all Core Web Vitals
  getCLS()
  getFID()
  getFCP()
  getLCP()
  getTTFB()
  getINP()
}
