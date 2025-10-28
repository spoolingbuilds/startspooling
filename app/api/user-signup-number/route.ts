import { NextRequest, NextResponse } from 'next/server'
import { getUserSignupNumber } from '@/lib/db'
import { sanitizeInput, validateInput, securityLogger } from '@/lib/security'

/**
 * GET /api/user-signup-number
 * 
 * Returns the user's signup number based on their email.
 * 
 * Query params: { email: string }
 * Response: { signupNumber: number | null }
 */
export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'
  
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

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
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get user's signup number
    const signupNumber = await getUserSignupNumber(sanitizedEmail)

    return NextResponse.json(
      { signupNumber },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('[User Signup Number API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get signup number' },
      { status: 500 }
    )
  }
}
