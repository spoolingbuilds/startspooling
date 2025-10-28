import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode } from '@/lib/verification'
import { sendVerificationCode, checkEmailRateLimit } from '@/lib/email'
import { updateVerificationCode, createSignup } from '@/lib/db'
import { setSessionCookie } from '@/lib/session'
import { sanitizeInput, validateInput, securityLogger, securityRateLimiter } from '@/lib/security'

/**
 * Extract IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Check various headers (in order of priority)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  // Parse x-forwarded-for (can contain multiple IPs)
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim())
    return ips[0] // Get the original client IP
  }

  if (realIp) return realIp
  if (cfConnectingIp) return cfConnectingIp

  return 'unknown'
}

/**
 * Extract user agent/browser client from request
 */
function getBrowserClient(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Mask email for privacy (show first 2 chars + domain)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email

  const maskedLocal = local.length > 2 
    ? `${local.substring(0, 2)}***`
    : '***'
  
  return `${maskedLocal}@${domain}`
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check rate limiting by IP address (3 signups per hour)
 */
async function checkRateLimitByIp(ipAddress: string): Promise<{ allowed: boolean; message?: string }> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true }
  }
  
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentSignups = await prisma.waitlistSignup.count({
      where: {
        ipAddress,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

    if (recentSignups >= 3) {
      return {
        allowed: false,
        message: 'slow down.'
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    // On error, allow the request to prevent false positives
    return { allowed: true }
  }
}

/**
 * Check rate limiting by email (5 signups per hour)
 */
async function checkRateLimitByEmail(email: string): Promise<{ allowed: boolean; message?: string }> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true }
  }
  
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentSignups = await prisma.waitlistSignup.count({
      where: {
        email,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

    if (recentSignups >= 5) {
      return {
        allowed: false,
        message: 'slow down.'
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return { allowed: true }
  }
}

/**
 * POST /api/waitlist
 * Handles waitlist signup with verification code generation
 * Cache-Control: no-cache (no caching for API routes)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ipAddress = getClientIp(request)
  
  try {
    // Parse request body
    const body = await request.json()
    const { email, referralSource } = body

    // Sanitize and validate email input
    const sanitizedEmail = sanitizeInput.email(email)
    const emailValidation = validateInput.email(sanitizedEmail)
    
    if (!emailValidation.isValid) {
      securityLogger.logFailedAttempt('signup', { 
        email: sanitizedEmail, 
        error: emailValidation.error,
        ipAddress 
      }, request)
      
      return NextResponse.json(
        { 
          error: emailValidation.error === 'required' ? 'required' : 'invalid format',
          success: false 
        },
        { status: 400 }
      )
    }

    // Check if IP is banned for signup attempts
    if (securityRateLimiter.isBanned(ipAddress, 'signup')) {
      securityLogger.logSuspiciousActivity('banned_ip_signup', { ipAddress }, request)
      return NextResponse.json(
        { 
          error: 'Access temporarily restricted',
          success: false 
        },
        { status: 429 }
      )
    }

    // Normalize email
    const normalizedEmail = sanitizedEmail.toLowerCase().trim()

    // Extract client information
    const browserClient = getBrowserClient(request)

    // Check rate limiting by IP
    const ipRateLimit = await checkRateLimitByIp(ipAddress)
    if (!ipRateLimit.allowed) {
      securityRateLimiter.trackFailedAttempt(ipAddress, 'signup')
      return NextResponse.json(
        { 
          error: ipRateLimit.message || 'Rate limit exceeded',
          success: false 
        },
        { status: 429 }
      )
    }

    // Check rate limiting by email
    const emailRateLimit = await checkRateLimitByEmail(normalizedEmail)
    if (!emailRateLimit.allowed) {
      securityRateLimiter.trackFailedAttempt(ipAddress, 'signup')
      return NextResponse.json(
        { 
          error: emailRateLimit.message || 'Too many requests',
          success: false 
        },
        { status: 429 }
      )
    }

    // Check if email exists
    const existingSignup = await prisma.waitlistSignup.findUnique({
      where: { email: normalizedEmail },
      select: {
        email: true,
        isVerified: true,
        lockedUntil: true
      }
    })

    // Handle existing email
    if (existingSignup) {
      // If already verified, continue with teasing message
      if (existingSignup.isVerified) {
        // Generate a new verification code anyway (for the psychological effect)
        const verificationCode = generateVerificationCode()
        console.log('[Waitlist] Generated teasing code for verified email:', {
          email: normalizedEmail,
          code: verificationCode
        })

        // Update the signup with new code (even though they're already verified)
        const updateResult = await updateVerificationCode(normalizedEmail, verificationCode)
        console.log('[Waitlist] Update result:', updateResult)
        
        if (!updateResult.success) {
          console.error('Failed to update verification code:', updateResult.error)
          return NextResponse.json(
            { 
              error: 'something broke. our fault.',
              success: false 
            },
            { status: 500 }
          )
        }

        // Check email rate limit for sending
        const emailRateLimitCheck = checkEmailRateLimit(normalizedEmail, ipAddress)
        if (!emailRateLimitCheck.allowed) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded. Please try again later.',
              success: false 
            },
            { status: 429 }
          )
        }

        // Send verification email (even though they're already verified)
        const emailResult = await sendVerificationCode(
          normalizedEmail,
          verificationCode,
          ipAddress
        )

        if (!emailResult.success) {
          console.error('Failed to send verification email:', emailResult.error)
          return NextResponse.json(
            { 
              error: 'connection failed. retry?',
              success: false 
            },
            { status: 500 }
          )
        }

        // Return teasing message
        const response = NextResponse.json({
          success: true,
          message: 'check your email. code sent.',
          email: maskEmail(normalizedEmail),
          alreadyVerified: true // Flag to indicate they're already verified
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })

        // Set session cookie for already verified user
        setSessionCookie(response, normalizedEmail, true)

        return response
      }

      // Check if account is locked
      if (existingSignup.lockedUntil && existingSignup.lockedUntil > new Date()) {
        return NextResponse.json(
          { 
            error: 'Account temporarily locked. Please try again later.',
            success: false 
          },
          { status: 429 }
        )
      }

      // Generate new verification code for unverified email
      const verificationCode = generateVerificationCode()
      console.log('[Waitlist] Generated new code for existing email:', {
        email: normalizedEmail,
        code: verificationCode
      })

      // Update the signup with new code and reset attempts
      const updateResult = await updateVerificationCode(normalizedEmail, verificationCode)
      console.log('[Waitlist] Update result:', updateResult)
      
      if (!updateResult.success) {
        console.error('Failed to update verification code:', updateResult.error)
        return NextResponse.json(
          { 
            error: 'something broke. our fault.',
            success: false 
          },
          { status: 500 }
        )
      }

      // Check email rate limit for sending
      const emailRateLimitCheck = checkEmailRateLimit(normalizedEmail, ipAddress)
      if (!emailRateLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please try again later.',
            success: false 
          },
          { status: 429 }
        )
      }

      // Send verification email
      const emailResult = await sendVerificationCode(
        normalizedEmail,
        verificationCode,
        ipAddress
      )

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error)
        return NextResponse.json(
          { 
            error: 'connection failed. retry?',
            success: false 
          },
          { status: 500 }
        )
      }


      // Create response with session cookie
      const response = NextResponse.json({
        success: true,
        message: 'check your email. code sent.',
        email: maskEmail(normalizedEmail)
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      // Set session cookie for unverified user
      setSessionCookie(response, normalizedEmail, false)

      return response
    }

    // Create new signup
    const verificationCode = generateVerificationCode()

    // Create signup record
    const createResult = await createSignup(
      normalizedEmail,
      verificationCode,
      browserClient,
      ipAddress,
      referralSource
    )

    if (!createResult.success) {
      console.error('Failed to create signup:', createResult.error)
      return NextResponse.json(
        { 
          error: 'Failed to create signup',
          success: false 
        },
        { status: 500 }
      )
    }

    // Check email rate limit for sending
    const emailRateLimitCheck = checkEmailRateLimit(normalizedEmail, ipAddress)
    if (!emailRateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          success: false 
        },
        { status: 429 }
      )
    }

    // Send verification email
    const emailResult = await sendVerificationCode(
      normalizedEmail,
      verificationCode,
      ipAddress
    )

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      return NextResponse.json(
        { 
          error: 'Failed to send verification email',
          success: false 
        },
        { status: 500 }
      )
    }


    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'check your email. code sent.',
      email: maskEmail(normalizedEmail)
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    // Set session cookie for new unverified user
    setSessionCookie(response, normalizedEmail, false)

    return response

  } catch (error) {
    console.error('[Waitlist] Signup error:', error)
    console.error('[Waitlist] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Include error details in response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    const response = NextResponse.json(
      { 
        error: 'something broke. our fault.',
        success: false,
        // Include error details in development
        ...(process.env.NODE_ENV === 'development' && {
          details: errorMessage,
          stack: errorStack
        })
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
    return response
  }
}
