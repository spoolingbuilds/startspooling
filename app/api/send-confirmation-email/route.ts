import { NextRequest, NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/email'

/**
 * POST /api/send-confirmation-email
 * 
 * Sends confirmation email after successful verification.
 * This is a server-side API route that has access to environment variables.
 * 
 * Request body: { email: string, signupNumber: number, totalSignups?: number }
 * 
 * Success (200): { success: true, message: string }
 * Failure (400): { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, signupNumber, totalSignups } = body

    // Validate required fields
    if (!email || !signupNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and signup number are required'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    // Validate signup number
    if (typeof signupNumber !== 'number' || signupNumber < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid signup number'
        },
        { status: 400 }
      )
    }

    // Get IP address for rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Send confirmation email
    const result = await sendConfirmationEmail(
      email,
      signupNumber,
      totalSignups || signupNumber,
      ipAddress
    )

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'Confirmation email sent successfully'
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send confirmation email'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[Confirmation Email API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
