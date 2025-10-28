/**
 * Production-Ready Rate Limiter
 * 
 * Implements sliding window rate limiting with optional Redis support for
 * multi-instance deployments. Uses in-memory Map for single-instance deployments.
 * 
 * PRODUCTION SETUP:
 * - For single-instance: Uses in-memory Map (current implementation)
 * - For multi-instance: Uncomment Redis implementation below and configure
 * 
 * REDIS SETUP:
 * 1. Install Redis client: npm install ioredis (or upstash-redis)
 * 2. Set REDIS_URL environment variable
 * 3. Uncomment Redis implementation section below
 * 4. Replace InMemoryRateLimiter with RedisRateLimiter
 */

import { RATE_LIMITS } from '@/config/constants'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Rate limit record stored in memory
 */
interface RateLimit {
  timestamp: number
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number // seconds until next allowed request
}

/**
 * Rate limiter interface
 */
interface RateLimiter {
  check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult>
  
  cleanup(): void
}

// ============================================================================
// IN-MEMORY RATE LIMITER (Single Instance)
// ============================================================================

/**
 * In-memory rate limiter using Map
 * 
 * Use this for:
 * - Development
 * - Single-instance deployments
 * - Testing
 * 
 * NOT suitable for:
 * - Multi-instance deployments
 * - Serverless environments with multiple cold starts
 */
class InMemoryRateLimiter implements RateLimiter {
  private store: Map<string, RateLimit[]>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.store = new Map()
    
    // Periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  async check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get or initialize records for this identifier
    let records = this.store.get(identifier) || []
    
    // Filter out expired records
    records = records.filter(record => record.timestamp > windowStart)
    
    // Calculate remaining requests
    const remaining = Math.max(0, maxRequests - records.length)
    const allowed = remaining > 0
    
    // If allowed, add new request
    if (allowed) {
      records.push({ timestamp: now })
      this.store.set(identifier, records)
    }
    
    // Calculate reset time
    let resetAt = new Date(now + windowMs)
    let retryAfter: number | undefined
    
    if (!allowed && records.length > 0) {
      // Find oldest request in window
      const oldestRecord = records[0]
      resetAt = new Date(oldestRecord.timestamp + windowMs)
      
      // Calculate retry-after in seconds
      const msUntilReset = resetAt.getTime() - now
      retryAfter = Math.ceil(msUntilReset / 1000)
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter
    }
  }

  cleanup(): void {
    const now = Date.now()
    
    const entries = Array.from(this.store.entries())
    for (const [identifier, records] of entries) {
      // Remove all expired records
      const validRecords = records.filter(record => {
        // Keep records from last hour (assuming max window is 1 hour)
        return now - record.timestamp < 60 * 60 * 1000
      })
      
      if (validRecords.length === 0) {
        this.store.delete(identifier)
      } else {
        this.store.set(identifier, validRecords)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// ============================================================================
// REDIS RATE LIMITER (Multi-Instance)
// ============================================================================

/**
 * Redis-based rate limiter for production
 * 
 * UNCOMMENT AND CONFIGURE THIS FOR PRODUCTION:
 * 
 * 1. Install Redis client:
 *    npm install ioredis
 * 
 *    OR for Serverless Redis:
 *    npm install @upstash/redis
 * 
 * 2. Set environment variable:
 *    REDIS_URL=redis://localhost:6379
 *    OR for Upstash: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * 
 * 3. Import and instantiate Redis client:
 *    import Redis from 'ioredis'
 *    const redis = new Redis(process.env.REDIS_URL)
 * 
 * 4. Replace InMemoryRateLimiter with RedisRateLimiter below
 */

/*
import Redis from 'ioredis'

class RedisRateLimiter implements RateLimiter {
  private redis: Redis

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  }

  async check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    const windowStart = now - windowMs

    // Get all requests in window
    const records = await this.redis.zrangebyscore(
      key,
      windowStart,
      '+inf',
      'WITHSCORES'
    )

    // Count requests
    const count = records.length / 2 // Redis returns [value, score, value, score, ...]
    const remaining = Math.max(0, maxRequests - count)
    const allowed = remaining > 0

    if (allowed) {
      // Add new request
      await this.redis.zadd(key, now, `${now}-${Math.random()}`)
      
      // Set TTL to windowMs
      await this.redis.pexpire(key, windowMs)
    }

    // Calculate reset time
    let resetAt = new Date(now + windowMs)
    let retryAfter: number | undefined

    if (!allowed && count > 0) {
      // Oldest request timestamp
      const oldestScore = parseInt(records[1] as string)
      resetAt = new Date(oldestScore + windowMs)
      const msUntilReset = resetAt.getTime() - now
      retryAfter = Math.ceil(msUntilReset / 1000)
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter
    }
  }

  cleanup(): void {
    // Redis handles TTL automatically, no manual cleanup needed
  }

  async destroy(): Promise<void> {
    await this.redis.quit()
  }
}
*/

// ============================================================================
// RATE LIMITER INSTANCE
// ============================================================================

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

/**
 * Get or create rate limiter instance
 * 
 * In production with multiple instances, uncomment the Redis implementation
 * above and change this to return new RedisRateLimiter()
 */
function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    // For single-instance deployments
    rateLimiterInstance = new InMemoryRateLimiter()
    
    // For multi-instance deployments, use Redis:
    // rateLimiterInstance = new RedisRateLimiter()
  }
  return rateLimiterInstance
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check rate limit with pre-defined configurations
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getRateLimiter()
  return limiter.check(identifier, maxRequests, windowMs)
}

/**
 * Check signup rate limit by IP
 */
export async function checkSignupRateLimit(ipAddress: string): Promise<RateLimitResult> {
  return checkRateLimit(
    `signup:ip:${ipAddress}`,
    RATE_LIMITS.SIGNUP_PER_IP_HOUR,
    60 * 60 * 1000 // 1 hour
  )
}

/**
 * Check verification rate limit by IP
 */
export async function checkVerificationRateLimit(ipAddress: string): Promise<RateLimitResult> {
  return checkRateLimit(
    `verify:ip:${ipAddress}`,
    RATE_LIMITS.VERIFY_PER_IP_HOUR,
    60 * 60 * 1000 // 1 hour
  )
}

/**
 * Check verification attempts by email
 */
export async function checkVerificationAttempts(
  email: string,
  maxAttempts: number
): Promise<RateLimitResult> {
  return checkRateLimit(
    `verify:email:${email}`,
    maxAttempts,
    60 * 60 * 1000 // 1 hour
  )
}

/**
 * Check resend rate limit by email
 */
export async function checkResendRateLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimit(
    `resend:email:${email}`,
    RATE_LIMITS.RESEND_PER_EMAIL_HOUR,
    60 * 60 * 1000 // 1 hour
  )
}

/**
 * Check resend rate limit by IP
 */
export async function checkResendIPRateLimit(ipAddress: string): Promise<RateLimitResult> {
  return checkRateLimit(
    `resend:ip:${ipAddress}`,
    10, // 10 requests per hour
    60 * 60 * 1000 // 1 hour
  )
}

/**
 * Check email sending rate limit
 */
export async function checkEmailSendingRateLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimit(
    `email:send:${email}`,
    RATE_LIMITS.EMAIL_SEND_PER_HOUR,
    60 * 60 * 1000 // 1 hour
  )
}

/**
 * Manual cleanup (called periodically)
 */
export function cleanupRateLimiter(): void {
  const limiter = getRateLimiter()
  limiter.cleanup()
}

/**
 * Destroy rate limiter instance (for cleanup/testing)
 */
export function destroyRateLimiter(): void {
  const limiter = getRateLimiter()
  if ('destroy' in limiter && typeof limiter.destroy === 'function') {
    limiter.destroy()
  }
  rateLimiterInstance = null
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Using rate limiter in API route
 * 
 * import { checkSignupRateLimit } from '@/lib/rate-limiter'
 * 
 * export async function POST(request: NextRequest) {
 *   const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
 *   
 *   const rateLimitResult = await checkSignupRateLimit(ipAddress)
 *   
 *   if (!rateLimitResult.allowed) {
 *     return Response.json(
 *       { 
 *         error: 'Rate limit exceeded',
 *         retryAfter: rateLimitResult.retryAfter 
 *       },
 *       { 
 *         status: 429,
 *         headers: {
 *           'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
 *           'X-RateLimit-Limit': '3',
 *           'X-RateLimit-Remaining': '0',
 *           'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString()
 *         }
 *       }
 *     )
 *   }
 *   
 *   // Continue with request...
 * }
 */

/**
 * Example: Custom rate limit check
 * 
 * const result = await checkRateLimit(
 *   `custom:${userId}`,
 *   100, // max 100 requests
 *   60 * 1000 // per minute
 * )
 * 
 * if (result.allowed) {
 *   console.log(`${result.remaining} requests remaining`)
 * } else {
 *   console.log(`Rate limited. Try again in ${result.retryAfter} seconds`)
 * }
 */
