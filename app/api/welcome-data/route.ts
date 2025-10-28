import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeInput, validateInput, securityLogger } from '@/lib/security'

/**
 * GET /api/welcome-data
 * 
 * Returns the stored welcome message and calculated number for a user.
 * 
 * Query params: { email: string }
 * Response: { welcomeMessageText: string, calculatedNumber: number } | { error: string }
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

    // Get user's stored welcome data
    const user = await prisma.waitlistSignup.findUnique({
      where: { email: sanitizedEmail },
      select: {
        welcomeMessageText: true,
        calculatedNumber: true,
        isVerified: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'User not verified' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        welcomeMessageText: user.welcomeMessageText || 'access: granted. status: active.',
        calculatedNumber: user.calculatedNumber || (3246 + Math.floor(Math.random() * 1000) + 1)
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('[Welcome Data API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get welcome data' },
      { status: 500 }
    )
  }
}
