import { Resend } from 'resend'
import { verificationCodeTemplate, confirmationEmailTemplate, ConfirmationEmailData } from './email-templates'
import { analytics } from './analytics'

/**
 * Email service configuration
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@startspooling.com'
const FROM_NAME = 'StartSpooling'

// Log current email configuration for debugging (server-side only)
if (typeof window === 'undefined') {
  console.log('[Email Config] FROM_EMAIL:', FROM_EMAIL)
  console.log('[Email Config] RESEND_API_KEY configured:', !!RESEND_API_KEY)
}

// Validate API key configuration (server-side only)
if (typeof window === 'undefined' && (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key_here' || RESEND_API_KEY === '')) {
  console.error('[Email] ⚠️  WARNING: RESEND_API_KEY is not configured!')
  console.error('[Email] Please set RESEND_API_KEY in your .env.local file')
  console.error('[Email] Get your API key from https://resend.com/api-keys')
}

// Initialize Resend only on server side with valid API key
const resend = typeof window === 'undefined' && RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

/**
 * Get completion percentage based on project milestones
 */
function getCompletionPercentage(): number {
  const now = new Date()
  
  // Project milestones
  const milestones = [
    { date: new Date('2025-01-01'), percentage: 0 },    // Project start
    { date: new Date('2025-02-15'), percentage: 25 },   // Waitlist phase
    { date: new Date('2025-03-30'), percentage: 50 },    // Beta ready
    { date: new Date('2025-05-15'), percentage: 75 },   // Feature complete
    { date: new Date('2025-06-30'), percentage: 100 }   // Public launch
  ]
  
  // Find current milestone
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (now >= milestones[i].date) {
      return milestones[i].percentage
    }
  }
  
  return 0
}

/**
 * Get cryptic status message based on signup number
 */
function getCrypticStatus(signupNumber: number): string {
  const statuses = [
    'building in progress',
    'compiling memories',
    'archive expanding',
    'data streams flowing',
    'connections forming',
    'patterns emerging',
    'systems awakening',
    'networks converging',
    'possibilities unfolding',
    'future crystallizing'
  ]
  
  // Rotate through statuses based on signup number
  const index = (signupNumber - 1) % statuses.length
  return statuses[index]
}

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return typeof window === 'undefined' && 
         !!RESEND_API_KEY && 
         RESEND_API_KEY !== 'your_resend_api_key_here' && 
         RESEND_API_KEY !== '' &&
         resend !== null
}

/**
 * Rate limiting configuration
 */
const MAX_SENDS_PER_EMAIL_PER_HOUR = 5
const MAX_SENDS_PER_IP_PER_HOUR = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Rate limiting storage
 * In production, use Redis or database for distributed systems
 */
interface RateLimitEntry {
  timestamps: number[]
  count: number
}

const emailRateLimit = new Map<string, RateLimitEntry>()
const ipRateLimit = new Map<string, RateLimitEntry>()

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean
  error?: string
  retries?: number
}

/**
 * Clean up old entries from rate limiting maps
 */
function cleanupRateLimitMaps() {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS

  // Clean email rate limit
  const emailEntries = Array.from(emailRateLimit.entries())
  for (const [key, entry] of emailEntries) {
    entry.timestamps = entry.timestamps.filter(ts => ts > cutoff)
    if (entry.timestamps.length === 0) {
      emailRateLimit.delete(key)
    } else {
      entry.count = entry.timestamps.length
    }
  }

  // Clean IP rate limit
  const ipEntries = Array.from(ipRateLimit.entries())
  for (const [key, entry] of ipEntries) {
    entry.timestamps = entry.timestamps.filter(ts => ts > cutoff)
    if (entry.timestamps.length === 0) {
      ipRateLimit.delete(key)
    } else {
      entry.count = entry.timestamps.length
    }
  }
}

/**
 * Check if email sending is rate limited
 */
function isEmailRateLimited(email: string): boolean {
  cleanupRateLimitMaps()
  
  const entry = emailRateLimit.get(email)
  if (!entry) return false
  
  return entry.count >= MAX_SENDS_PER_EMAIL_PER_HOUR
}

/**
 * Check if IP is rate limited
 */
function isIpRateLimited(ip: string): boolean {
  cleanupRateLimitMaps()
  
  const entry = ipRateLimit.get(ip)
  if (!entry) return false
  
  return entry.count >= MAX_SENDS_PER_IP_PER_HOUR
}

/**
 * Record email send attempt for rate limiting
 */
function recordEmailSend(email: string, ip: string) {
  const now = Date.now()
  
  // Record for email
  if (!emailRateLimit.has(email)) {
    emailRateLimit.set(email, { timestamps: [], count: 0 })
  }
  const emailEntry = emailRateLimit.get(email)!
  emailEntry.timestamps.push(now)
  emailEntry.count = emailEntry.timestamps.length
  
  // Record for IP
  if (!ipRateLimit.has(ip)) {
    ipRateLimit.set(ip, { timestamps: [], count: 0 })
  }
  const ipEntry = ipRateLimit.get(ip)!
  ipEntry.timestamps.push(now)
  ipEntry.count = ipEntry.timestamps.length
}

/**
 * Send email with retry logic
 */
async function sendEmailWithRetry(
  to: string,
  subject: string,
  template: { text: string; html: string },
  maxRetries: number = 2
): Promise<EmailSendResult> {
  // Check if email service is configured
  if (!isEmailConfigured()) {
    const errorMsg = 'Email service not configured. Please set RESEND_API_KEY in .env.local'
    console.error(`[Email] ❌ ${errorMsg}`)
    return {
      success: false,
      error: errorMsg
    }
  }

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (!resend) {
        throw new Error('Resend client not initialized')
      }
      
      const result = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        text: template.text,
        html: template.html,
      })
      
      console.log(`[Email] ✓ Successfully sent to ${to}`, result)
      
      return {
        success: true,
        retries: attempt
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`[Email] ❌ Failed to send to ${to} (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError)
      
      // Log detailed error information for debugging
      if (error && typeof error === 'object') {
        console.error('[Email] Error details:', {
          name: (error as any).name,
          message: (error as any).message,
          statusCode: (error as any).statusCode,
          from: FROM_EMAIL,
          to: to
        })
      }
      
      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Failed to send email',
    retries: maxRetries
  }
}

/**
 * Send verification code email
 * @param email - Recipient email address
 * @param code - 6-character verification code
 * @param ipAddress - IP address for rate limiting (optional)
 * @returns EmailSendResult
 */
export async function sendVerificationCode(
  email: string,
  code: string,
  ipAddress?: string
): Promise<EmailSendResult> {
  try {
    // Rate limiting check
    if (isEmailRateLimited(email)) {
      console.warn(`[Email] Rate limited for email: ${email}`)
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }
    }

    if (ipAddress && isIpRateLimited(ipAddress)) {
      console.warn(`[Email] Rate limited for IP: ${ipAddress}`)
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }
    }

    // Create email template
    const template = verificationCodeTemplate(code)
    
    // Send email with retry logic
    const result = await sendEmailWithRetry(
      email,
      'your access code',
      template
    )

    // Record send attempt for rate limiting
    if (result.success && ipAddress) {
      recordEmailSend(email, ipAddress)
    }

    return result
  } catch (error) {
    console.error('[Email] Error in sendVerificationCode:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email'
    }
  }
}

/**
 * Resend verification code email
 * This is an alias for sendVerificationCode with specific logging
 * @param email - Recipient email address
 * @param code - 6-character verification code
 * @param ipAddress - IP address for rate limiting (optional)
 * @returns EmailSendResult
 */
export async function resendVerificationCode(
  email: string,
  code: string,
  ipAddress?: string
): Promise<EmailSendResult> {
  return sendVerificationCode(email, code, ipAddress)
}

/**
 * Send confirmation email after successful verification
 * @param email - Recipient email address
 * @param signupNumber - User's signup number
 * @param totalSignups - Total number of signups (optional, defaults to signupNumber)
 * @param ipAddress - IP address for rate limiting (optional)
 * @returns EmailSendResult
 */
export async function sendConfirmationEmail(
  email: string,
  signupNumber: number,
  totalSignups?: number,
  ipAddress?: string
): Promise<EmailSendResult> {
  try {
    // Rate limiting check
    if (isEmailRateLimited(email)) {
      console.warn(`[Email] Rate limited for confirmation email: ${email}`)
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }
    }

    if (ipAddress && isIpRateLimited(ipAddress)) {
      console.warn(`[Email] Rate limited for IP confirmation email: ${ipAddress}`)
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }
    }

    // Prepare confirmation email data
    const now = new Date()
    const confirmationData: ConfirmationEmailData = {
      signupNumber,
      totalSignups: totalSignups || signupNumber,
      date: now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      timestamp: now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      completionPercentage: getCompletionPercentage(),
      crypticStatus: getCrypticStatus(signupNumber)
    }

    // Create email template
    const template = confirmationEmailTemplate(confirmationData)
    
    // Send email with retry logic
    const result = await sendEmailWithRetry(
      email,
      'Archived',
      template
    )

    // Record send attempt for rate limiting
    if (result.success && ipAddress) {
      recordEmailSend(email, ipAddress)
    }

    // Track analytics
    if (result.success) {
      console.log(`Confirmation email sent to ${email}`)
      analytics.confirmationEmailSent(signupNumber, email)
    } else {
      console.error(`Failed to send confirmation email:`, result.error)
      analytics.confirmationEmailFailed(signupNumber, email, result.error || 'Unknown error')
    }

    return result
  } catch (error) {
    console.error('[Email] Error in sendConfirmationEmail:', error)
    
    // Track analytics for catch block error
    analytics.confirmationEmailFailed(signupNumber, email, error instanceof Error ? error.message : 'Unknown error')
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send confirmation email'
    }
  }
}

/**
 * Get rate limit statistics for monitoring
 */
export function getRateLimitStats(): {
  emailEntries: number
  ipEntries: number
  topEmails: Array<{ email: string; count: number }>
  topIps: Array<{ ip: string; count: number }>
} {
  cleanupRateLimitMaps()
  
  const emailArray = Array.from(emailRateLimit.entries())
    .map(([email, entry]) => ({ email, count: entry.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  const ipArray = Array.from(ipRateLimit.entries())
    .map(([ip, entry]) => ({ ip, count: entry.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  return {
    emailEntries: emailRateLimit.size,
    ipEntries: ipRateLimit.size,
    topEmails: emailArray,
    topIps: ipArray
  }
}

/**
 * Clear rate limit for testing/debugging
 */
export function clearRateLimits(email?: string, ip?: string): void {
  if (email) {
    emailRateLimit.delete(email)
  }
  if (ip) {
    ipRateLimit.delete(ip)
  }
  if (!email && !ip) {
    emailRateLimit.clear()
    ipRateLimit.clear()
  }
}

/**
 * Check if email is rate limited (for API responses)
 */
export function checkEmailRateLimit(email: string, ip?: string): {
  allowed: boolean
  emailLimited: boolean
  ipLimited: boolean
  emailCount?: number
  ipCount?: number
} {
  cleanupRateLimitMaps()
  
  const emailLimited = isEmailRateLimited(email)
  const ipLimited = ip ? isIpRateLimited(ip) : false
  
  return {
    allowed: !emailLimited && !ipLimited,
    emailLimited,
    ipLimited,
    emailCount: emailRateLimit.get(email)?.count,
    ipCount: ip ? ipRateLimit.get(ip)?.count : undefined
  }
}

