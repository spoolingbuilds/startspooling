import { NextRequest, NextResponse } from 'next/server'

// Session configuration (should match middleware)
export const SESSION_CONFIG = {
  COOKIE_NAME: 'spool_session',
  MAX_AGE: 60 * 60 * 1000, // 1 hour
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax' as const,
}

/**
 * Get session from cookie
 */
export function getSessionFromCookie(request: NextRequest): { email: string; verified: boolean } | null {
  const cookie = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)
  if (!cookie) return null
  
  try {
    const sessionData = JSON.parse(Buffer.from(cookie.value, 'base64').toString('utf-8'))
    
    // Check if session is expired
    if (Date.now() - sessionData.timestamp > SESSION_CONFIG.MAX_AGE) {
      return null
    }
    
    return {
      email: sessionData.email,
      verified: sessionData.verified || false
    }
  } catch {
    return null
  }
}

/**
 * Set session cookie
 */
export function setSessionCookie(response: NextResponse, email: string, verified: boolean = false): void {
  const sessionData = {
    email,
    timestamp: Date.now(),
    verified
  }
  
  const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString('base64')
  
  response.cookies.set(SESSION_CONFIG.COOKIE_NAME, cookieValue, {
    maxAge: SESSION_CONFIG.MAX_AGE,
    httpOnly: SESSION_CONFIG.HTTP_ONLY,
    secure: SESSION_CONFIG.SECURE,
    sameSite: SESSION_CONFIG.SAME_SITE,
    path: '/'
  })
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_CONFIG.COOKIE_NAME)
}

/**
 * Update session verification status
 */
export function updateSessionVerification(response: NextResponse, email: string): void {
  setSessionCookie(response, email, true)
}
