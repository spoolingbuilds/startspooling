import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sanitizeCodeInput,
  validateCodeFormat,
  isCodeExpired,
  MAX_ATTEMPTS,
  LOCKOUT_DURATION_MS
} from '@/lib/verification'
import {
  getSignupByEmail,
  checkIfLocked,
  incrementVerificationAttempts,
  lockAccount,
  logVerificationAttempt,
  verifyAndUnlock,
  incrementCodeReverificationCount
} from '@/lib/db'
import { setSessionCookie } from '@/lib/session'
import { sanitizeInput, validateInput, securityLogger, securityRateLimiter } from '@/lib/security'

/**
 * POST /api/verify-code
 * 
 * Verifies a 6-character code with attempt tracking and lockout.
 * 
 * Request body: { email: string, code: string }
 * 
 * Success (200): { success: true, verified: true, welcomeMessageId: number, message: string }
 * Failure (400): { success: false, verified: false, attemptsRemaining: number, message: string }
 * Locked (429): { success: false, locked: true, lockTimeRemaining: number, message: string }
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'
  
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('[Verify API] Failed to parse request body:', error)
      securityLogger.logFailedAttempt('verification', { error: 'invalid_json', ipAddress }, request)
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Invalid request format'
        },
        { status: 400 }
      )
    }

    const { email, code } = body

    console.log('[Verify API] Received request:', { email, code })

    // Sanitize and validate email input
    const sanitizedEmail = sanitizeInput.email(email)
    const emailValidation = validateInput.email(sanitizedEmail)
    
    if (!emailValidation.isValid) {
      securityLogger.logFailedAttempt('verification', { 
        email: sanitizedEmail, 
        error: emailValidation.error,
        ipAddress 
      }, request)
      
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Email is required'
        },
        { status: 400 }
      )
    }

    // Sanitize and validate code input
    const sanitizedCode = sanitizeInput.verificationCode(code)
    const codeValidation = validateInput.verificationCode(sanitizedCode)
    
    if (!codeValidation.isValid) {
      securityLogger.logFailedAttempt('verification', { 
        email: sanitizedEmail, 
        code: sanitizedCode,
        error: codeValidation.error,
        ipAddress 
      }, request)
      
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Code is required'
        },
        { status: 400 }
      )
    }

    // Check if IP is banned for verification attempts
    if (securityRateLimiter.isBanned(ipAddress, 'verification')) {
      securityLogger.logSuspiciousActivity('banned_ip_verification', { ipAddress }, request)
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Access temporarily restricted'
        },
        { status: 429 }
      )
    }

    // Get signup record by email
    const signupResult = await getSignupByEmail(sanitizedEmail)

    if (!signupResult.success || !signupResult.data) {
      console.error('[Verify API] Signup not found for email:', sanitizedEmail)
      securityLogger.logFailedAttempt('verification', { 
        email: sanitizedEmail, 
        error: 'signup_not_found',
        ipAddress 
      }, request)
      
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'No verification code found. Request a new one.'
        },
        { status: 400 }
      )
    }

    const signup = signupResult.data

    // Check if already verified
    if (signup.isVerified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Already verified'
        },
        { status: 400 }
      )
    }

    // Check if account is locked
    const lockCheck = await checkIfLocked(sanitizedEmail)

    if (lockCheck.isLocked && lockCheck.lockUntil) {
      const now = new Date()
      const lockTimeRemaining = lockCheck.lockUntil.getTime() - now.getTime()
      const minutesRemaining = Math.ceil(lockTimeRemaining / 60000)

      return NextResponse.json(
        {
          success: false,
          locked: true,
          lockTimeRemaining,
          message: `Locked. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`
        },
        { status: 429 }
      )
    }

    // Check if code expired (15 minutes from updatedAt, which is when the code was last generated)
    if (isCodeExpired(signup.updatedAt)) {
      console.log('[Verify API] Code expired for email:', sanitizedEmail)
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: 'Code expired. Request a new one.'
        },
        { status: 400 }
      )
    }

    // Compare codes
    console.log('[Verify] Comparing codes:', {
      stored: signup.verificationCode,
      received: code,
      sanitized: sanitizedCode,
      match: signup.verificationCode === sanitizedCode
    })
    
    const codeMatches = signup.verificationCode === sanitizedCode

    if (codeMatches) {
      // SUCCESS: Verify the account
      const welcomeMessageId = Math.floor(Math.random() * 30) + 1 // Random 1-30
      
      // Get welcome message text with better error handling
      let welcomeMessageText = 'access: granted. status: active.' // Default fallback
      try {
        const { getWelcomeMessageById } = await import('@/lib/welcome-messages')
        const welcomeMessage = getWelcomeMessageById(welcomeMessageId)
        if (welcomeMessage && welcomeMessage.message) {
          welcomeMessageText = welcomeMessage.message
        }
      } catch (error) {
        console.error('[Verify API] Error loading welcome message:', error)
        // Keep default fallback
      }
      
      // Calculate the user's number (3246 + total records at that moment)
      let calculatedNumber = 3246
      try {
        const totalRecords = await prisma.waitlistSignup.count()
        calculatedNumber = 3246 + totalRecords
      } catch (error) {
        console.error('[Verify API] Error counting records:', error)
        // Keep default fallback
      }

      // Update with proper error handling using the new verifyAndUnlock function
      try {
        const verifyResult = await verifyAndUnlock(sanitizedEmail, ipAddress)
        if (!verifyResult.success) {
          throw new Error(verifyResult.error)
        }
        
        // Update additional fields that verifyAndUnlock doesn't handle
        await prisma.waitlistSignup.update({
          where: { email: sanitizedEmail },
          data: {
            welcomeMessageId,
            welcomeMessageText,
            calculatedNumber
          }
        })
      } catch (dbError) {
        console.error('[Verify API] Database update error:', dbError)
        // Fallback to basic verification without tracking
        await prisma.waitlistSignup.update({
          where: { email: sanitizedEmail },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
            welcomeMessageId,
            verificationAttempts: 0,
            lockedUntil: null
          }
        })
      }

      // Log successful attempt
      await logVerificationAttempt(sanitizedEmail, sanitizedCode, true, ipAddress)
      
      // Track code re-verification (increment count for same code being verified again)
      await incrementCodeReverificationCount(sanitizedEmail)

      // Create response with session cookie
      const response = NextResponse.json(
        {
          success: true,
          verified: true,
          welcomeMessageId,
          message: 'Verified. Welcome.'
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )

      // Set session cookie for verified user
      setSessionCookie(response, sanitizedEmail, true)

      return response
    } else {
      // FAILURE: Increment attempts
      const incrementResult = await incrementVerificationAttempts(sanitizedEmail)

      if (incrementResult.success && incrementResult.data) {
        const newAttempts = incrementResult.data.verificationAttempts

        // Track failed attempt
        securityRateLimiter.trackFailedAttempt(ipAddress, 'verification')
        securityLogger.logFailedAttempt('verification', { 
          email: sanitizedEmail, 
          code: sanitizedCode,
          attempts: newAttempts,
          ipAddress 
        }, request)

        // Log failed attempt
        await logVerificationAttempt(sanitizedEmail, sanitizedCode, false, ipAddress)

        // Check if we should lock the account (>= 4 attempts)
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockUntilTime = new Date(Date.now() + LOCKOUT_DURATION_MS)
          await lockAccount(sanitizedEmail, lockUntilTime)

          return NextResponse.json(
            {
              success: false,
              verified: false,
              attemptsRemaining: 0,
              message: 'Too many failed attempts. Account locked. Try again in 1 hour.',
              locked: true
            },
            { status: 400 }
          )
        }

        // Return attempts remaining
        const attemptsRemaining = MAX_ATTEMPTS - newAttempts

        return NextResponse.json(
          {
            success: false,
            verified: false,
            attemptsRemaining,
            message: `Incorrect code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`
          },
          { status: 400 }
        )
      } else {
        // Fallback error
        console.error('[Verify API] Failed to increment attempts for email:', sanitizedEmail)
        securityLogger.logFailedAttempt('verification', { 
          email: sanitizedEmail, 
          error: 'increment_failed',
          ipAddress 
        }, request)
        
        return NextResponse.json(
          {
            success: false,
            verified: false,
            message: 'Verification failed. Please try again.'
          },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    console.error('[Verify API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        verified: false,
        message: 'Server error. Please try again.'
      },
      { status: 500 }
    )
  }
}
