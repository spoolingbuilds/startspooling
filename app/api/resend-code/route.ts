import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode } from '@/lib/verification'
import { sendVerificationCode } from '@/lib/email'

/**
 * Rate limiting configuration
 */
const MAX_RESENDS_PER_EMAIL_PER_HOUR = 3
const MAX_REQUESTS_PER_IP_PER_HOUR = 10
const HOUR_IN_MS = 60 * 60 * 1000

/**
 * Get IP address from request
 */
function getIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

/**
 * Check rate limits for resend requests
 * Uses VerificationAttempt table with 'RESEND' marker to track resends
 */
async function checkResendRateLimit(email: string, ipAddress: string): Promise<{
  allowed: boolean
  message?: string
  waitMinutes?: number
}> {
  const oneHourAgo = new Date(Date.now() - HOUR_IN_MS)
  
  // Check IP-based rate limit (10 requests per hour per IP)
  const ipRequestCount = await prisma.verificationAttempt.count({
    where: {
      ipAddress,
      timestamp: {
        gte: oneHourAgo
      }
    }
  })
  
  if (ipRequestCount >= MAX_REQUESTS_PER_IP_PER_HOUR) {
    const oldestAttempt = await prisma.verificationAttempt.findFirst({
      where: {
        ipAddress,
        timestamp: {
          gte: oneHourAgo
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })
    
    if (oldestAttempt) {
      const waitTime = HOUR_IN_MS - (Date.now() - oldestAttempt.timestamp.getTime())
      const waitMinutes = Math.ceil(waitTime / 60000)
      return {
        allowed: false,
        message: `too many resend attempts. wait ${waitMinutes} minutes.`,
        waitMinutes
      }
    }
  }
  
  // Check email-based rate limit (3 resends per hour per email)
  // Count how many RESEND attempts in the last hour for this email
  const resendCount = await prisma.verificationAttempt.count({
    where: {
      email,
      attemptedCode: 'RESEND',
      timestamp: {
        gte: oneHourAgo
      }
    }
  })
  
  if (resendCount >= MAX_RESENDS_PER_EMAIL_PER_HOUR) {
    // Find the oldest RESEND in the last hour to calculate wait time
    const oldestResend = await prisma.verificationAttempt.findFirst({
      where: {
        email,
        attemptedCode: 'RESEND',
        timestamp: {
          gte: oneHourAgo
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })
    
    if (oldestResend) {
      const waitTime = HOUR_IN_MS - (Date.now() - oldestResend.timestamp.getTime())
      const waitMinutes = Math.ceil(waitTime / 60000)
      return {
        allowed: false,
        message: `too many resend attempts. wait ${waitMinutes} minutes.`,
        waitMinutes
      }
    }
  }
  
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const ipAddress = getIpAddress(request)
    
    console.log('[Resend API] Received request:', { email })

    // Validate email input
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      // Don't expose whether email exists for security
      return NextResponse.json(
        { success: false, message: 'no signup found with that email' },
        { status: 404 }
      )
    }

    // Find signup by email
    const signup = await prisma.waitlistSignup.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    // Don't expose whether email exists for non-existent emails
    if (!signup) {
      return NextResponse.json(
        { success: false, message: 'no signup found with that email' },
        { status: 404 }
      )
    }

    // Allow resending to already verified users (for consistency with waitlist API)
    // The waitlist API sends codes to already verified users, so resend should too
    // if (signup.isVerified) {
    //   return NextResponse.json(
    //     { success: false, message: 'already verified' },
    //     { status: 400 }
    //   )
    // }

    // Check if account is locked
    if (signup.lockedUntil && signup.lockedUntil > new Date()) {
      const waitTime = signup.lockedUntil.getTime() - Date.now()
      const waitMinutes = Math.ceil(waitTime / 60000)
      
      return NextResponse.json(
        { 
          success: false, 
          message: `account locked. try again in ${waitMinutes} minutes.`,
          lockUntil: signup.lockedUntil
        },
        { status: 423 }
      )
    }

    // Check rate limits
    const rateLimitCheck = await checkResendRateLimit(email, ipAddress)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          message: rateLimitCheck.message 
        },
        { status: 429 }
      )
    }

    // Generate new verification code
    const newCode = generateVerificationCode()
    
    // Update signup with new code and reset attempts
    await prisma.waitlistSignup.update({
      where: { email },
      data: {
        verificationCode: newCode,
        verificationAttempts: 0,
        lockedUntil: null, // Remove any existing lock
        updatedAt: new Date()
      }
    })

    // Log the resend attempt
    await prisma.verificationAttempt.create({
      data: {
        email,
        attemptedCode: 'RESEND', // Special marker for resends
        wasSuccessful: true,
        ipAddress
      }
    })

    // Send email with new code
    const emailResult = await sendVerificationCode(email, newCode, ipAddress)
    
    if (!emailResult.success) {
      console.error(`[Resend] Failed to send email to ${email}:`, emailResult.error)
      return NextResponse.json(
        { success: false, message: 'failed to send email' },
        { status: 500 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'new code sent. check your email.'
    })

  } catch (error) {
    console.error('[Resend] Error:', error)
    return NextResponse.json(
      { success: false, message: 'internal server error' },
      { status: 500 }
    )
  }
}
