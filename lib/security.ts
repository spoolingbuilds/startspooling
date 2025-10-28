// Security utilities for input sanitization, validation, and monitoring
// /lib/security.ts

import { NextRequest } from 'next/server'

// Input sanitization functions
export const sanitizeInput = {
  // Sanitize email input
  email: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    
    // Trim whitespace and convert to lowercase
    let sanitized = input.trim().toLowerCase()
    
    // Remove any characters that aren't valid for email
    // Keep only: letters, numbers, @, ., +, -, _
    sanitized = sanitized.replace(/[^a-z0-9@.+_-]/g, '')
    
    // Limit length to prevent abuse
    if (sanitized.length > 254) {
      sanitized = sanitized.substring(0, 254)
    }
    
    return sanitized
  },

  // Sanitize verification code
  verificationCode: (input: string): string => {
    if (!input || typeof input !== 'string') return ''
    
    // Only allow valid characters (excludes 0, O, I, l, 1)
    let sanitized = input.replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '').toUpperCase()
    
    // Limit to 6 characters
    if (sanitized.length > 6) {
      sanitized = sanitized.substring(0, 6)
    }
    
    return sanitized
  },

  // Sanitize general text input
  text: (input: string, maxLength: number = 1000): string => {
    if (!input || typeof input !== 'string') return ''
    
    // Trim whitespace
    let sanitized = input.trim()
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>'"&]/g, '')
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }
    
    return sanitized
  }
}

// Input validation functions
export const validateInput = {
  // Validate email format
  email: (email: string): { isValid: boolean; error?: string } => {
    if (!email) {
      return { isValid: false, error: 'required' }
    }
    
    if (email.length > 254) {
      return { isValid: false, error: 'too long' }
    }
    
    // Basic email regex (RFC 5322 compliant)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'invalid format' }
    }
    
    return { isValid: true }
  },

  // Validate verification code
  verificationCode: (code: string): { isValid: boolean; error?: string } => {
    if (!code) {
      return { isValid: false, error: 'required' }
    }
    
    if (code.length !== 6) {
      return { isValid: false, error: 'invalid length' }
    }
    
    // Only allow valid characters (excludes 0, O, I, l, 1)
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)) {
      return { isValid: false, error: 'invalid format' }
    }
    
    return { isValid: true }
  }
}

// Security monitoring and logging
export const securityLogger = {
  // Log suspicious activity
  logSuspiciousActivity: (type: string, details: any, request?: NextRequest) => {
    const logData = {
      timestamp: new Date().toISOString(),
      type,
      details,
      ip: request?.ip || request?.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      url: request?.url || 'unknown'
    }
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // fetch('/api/security-log', { method: 'POST', body: JSON.stringify(logData) })
      console.warn('[SECURITY] Suspicious activity:', logData)
    } else {
      console.warn('[SECURITY] Suspicious activity:', logData)
    }
  },

  // Log failed attempts
  logFailedAttempt: (type: 'signup' | 'verification' | 'resend', details: any, request?: NextRequest) => {
    securityLogger.logSuspiciousActivity(`failed_${type}`, details, request)
  },

  // Log rate limit violations
  logRateLimitViolation: (type: string, ip: string, request?: NextRequest) => {
    securityLogger.logSuspiciousActivity('rate_limit_violation', { type, ip }, request)
  }
}

// Rate limiting with enhanced security
export class SecurityRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number; banned: boolean; banExpiry: number }> = new Map()
  
  // Track failed attempts and implement temporary bans
  trackFailedAttempt = (identifier: string, type: 'signup' | 'verification' | 'resend'): boolean => {
    const now = Date.now()
    const key = `${identifier}:${type}`
    
    const current = this.attempts.get(key) || { count: 0, lastAttempt: 0, banned: false, banExpiry: 0 }
    
    // Check if currently banned
    if (current.banned && now < current.banExpiry) {
      return false // Still banned
    }
    
    // Reset ban if expired
    if (current.banned && now >= current.banExpiry) {
      current.banned = false
      current.count = 0
    }
    
    // Increment failed attempts
    current.count++
    current.lastAttempt = now
    
    // Ban after 20 failed attempts
    if (current.count >= 20) {
      current.banned = true
      current.banExpiry = now + (60 * 60 * 1000) // 1 hour ban
      securityLogger.logSuspiciousActivity('ip_banned', { identifier, type, attempts: current.count })
    }
    
    this.attempts.set(key, current)
    
    // Clean up old entries (older than 24 hours)
    this.cleanup()
    
    return !current.banned
  }
  
  // Check if identifier is banned
  isBanned = (identifier: string, type: 'signup' | 'verification' | 'resend'): boolean => {
    const key = `${identifier}:${type}`
    const current = this.attempts.get(key)
    
    if (!current) return false
    
    const now = Date.now()
    
    // Check if ban has expired
    if (current.banned && now >= current.banExpiry) {
      current.banned = false
      current.count = 0
      this.attempts.set(key, current)
      return false
    }
    
    return current.banned
  }
  
  // Get attempt count for identifier
  getAttemptCount = (identifier: string, type: 'signup' | 'verification' | 'resend'): number => {
    const key = `${identifier}:${type}`
    const current = this.attempts.get(key)
    return current?.count || 0
  }
  
  // Clean up old entries
  private cleanup = () => {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    Array.from(this.attempts.entries()).forEach(([key, value]) => {
      if (now - value.lastAttempt > maxAge) {
        this.attempts.delete(key)
      }
    })
  }
}

// API request validation
export const validateApiRequest = (request: NextRequest): { isValid: boolean; error?: string } => {
  // Check content type for POST requests
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return { isValid: false, error: 'Invalid content type' }
    }
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-client-ip']
  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header)
    if (value && value.includes(',')) {
      // Multiple IPs in forwarded header - potential proxy abuse
      securityLogger.logSuspiciousActivity('suspicious_headers', { header, value }, request)
    }
  }
  
  return { isValid: true }
}

// Environment variable validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  const required = [
    'RESEND_API_KEY',
    'DATABASE_URL'
  ]
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`)
    }
  }
  
  // Validate email configuration
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_')) {
    errors.push('Invalid RESEND_API_KEY format')
  }
  
  // Validate database URL
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('Invalid DATABASE_URL format')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export singleton instance
export const securityRateLimiter = new SecurityRateLimiter()
