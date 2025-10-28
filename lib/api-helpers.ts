/**
 * API Helper Functions for Rate Limiting
 * 
 * Provides utilities for integrating rate limiting into Next.js API routes
 * with proper error handling and standard HTTP headers.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  RateLimitResult,
  checkSignupRateLimit,
  checkVerificationRateLimit,
  checkVerificationAttempts,
  checkResendRateLimit,
  checkResendIPRateLimit,
  checkEmailSendingRateLimit,
} from './rate-limiter'

/**
 * Get client IP address from request headers
 * Supports various proxy headers and Cloudflare
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    const ips = forwarded.split(',').map(ip => ip.trim())
    return ips[0]
  }

  if (realIp) return realIp
  if (cfConnectingIp) return cfConnectingIp

  return 'unknown'
}

/**
 * Create rate limit error response with proper headers
 */
function createRateLimitResponse(
  result: RateLimitResult,
  maxRequests: number,
  customMessage?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: customMessage || 'Rate limit exceeded',
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter?.toString() || '3600',
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
      },
    }
  )
}

/**
 * Check signup rate limit and return error response if exceeded
 * Returns null if allowed, NextResponse if blocked
 */
export async function checkSignupRateLimitHelper(
  request: NextRequest
): Promise<NextResponse | null> {
  const ipAddress = getClientIp(request)
  const result = await checkSignupRateLimit(ipAddress)

  if (!result.allowed) {
    return createRateLimitResponse(
      result,
      3,
      'Too many signup attempts. Please try again later.'
    )
  }

  return null
}

/**
 * Check verification rate limit by IP
 */
export async function checkVerificationIPRateLimitHelper(
  request: NextRequest
): Promise<NextResponse | null> {
  const ipAddress = getClientIp(request)
  const result = await checkVerificationRateLimit(ipAddress)

  if (!result.allowed) {
    return createRateLimitResponse(
      result,
      10,
      'Too many verification attempts from this IP. Please try again later.'
    )
  }

  return null
}

/**
 * Check verification rate limit by email
 */
export async function checkVerificationEmailRateLimitHelper(
  email: string,
  maxAttempts: number
): Promise<NextResponse | null> {
  const result = await checkVerificationAttempts(email, maxAttempts)

  if (!result.allowed) {
    return createRateLimitResponse(
      result,
      maxAttempts,
      `Too many verification attempts for this email. ${result.remaining} attempts remaining.`
    )
  }

  return null
}

/**
 * Check resend rate limit by email
 */
export async function checkResendEmailRateLimitHelper(
  email: string
): Promise<NextResponse | null> {
  const result = await checkResendRateLimit(email)

  if (!result.allowed) {
    return createRateLimitResponse(
      result,
      3,
      'Too many resend attempts. Please try again later.'
    )
  }

  return null
}

/**
 * Check resend rate limit by IP
 */
export async function checkResendIPRateLimitHelper(
  request: NextRequest
): Promise<NextResponse | null> {
  const ipAddress = getClientIp(request)
  const result = await checkResendIPRateLimit(ipAddress)

  if (!result.allowed) {
    return createRateLimitResponse(
      result,
      10,
      'Too many requests from this IP. Please try again later.'
    )
  }

  return null
}

/**
 * Check email sending rate limit
 */
export async function checkEmailSendingRateLimitHelper(
  email: string
): Promise<NextResponse | null> {
  const result = await checkEmailSendingRateLimit(email)

  if (!result.allowed) {
    return createRateLimitResponse(
      result,
      5,
      'Too many email requests. Please try again later.'
    )
  }

  return null
}

/**
 * Example usage in API route:
 * 
 * export async function POST(request: NextRequest) {
 *   // Check rate limit
 *   const rateLimitError = await checkSignupRateLimitHelper(request)
 *   if (rateLimitError) {
 *     return rateLimitError
 *   }
 *   
 *   // Continue with request processing...
 * }
 */

/**
 * Combine multiple rate limit checks
 * Returns first error or null if all pass
 */
export async function checkMultipleRateLimits(
  checks: Promise<NextResponse | null>[]
): Promise<NextResponse | null> {
  const results = await Promise.all(checks)
  
  for (const result of results) {
    if (result) {
      return result
    }
  }
  
  return null
}

/**
 * Example: Check both IP and email rate limits
 * 
 * const rateLimitError = await checkMultipleRateLimits([
 *   checkSignupRateLimitHelper(request),
 *   checkEmailSendingRateLimitHelper(email)
 * ])
 * 
 * if (rateLimitError) {
 *   return rateLimitError
 * }
 */
