# Rate Limiting System

A production-ready rate limiting system with in-memory and Redis support.

## Overview

The rate limiting system provides:
- **Sliding window algorithm** for accurate rate limiting
- **Automatic cleanup** of expired entries
- **Multi-strategy rate limiting** (by IP, by email, etc.)
- **Production-ready** with Redis support for multi-instance deployments
- **Type-safe** TypeScript implementation
- **Comprehensive error responses** with retry-after headers

## Features

### Core Functionality

1. **Sliding Window Algorithm**: More accurate than fixed window, prevents burst at window boundaries
2. **Automatic Cleanup**: Old entries are removed to prevent memory leaks
3. **Rate Limit Information**: Returns remaining requests, reset time, and retry-after
4. **Multiple Strategies**: IP-based, email-based, and custom rate limiting

### Production Features

- **In-memory Map**: For single-instance deployments
- **Redis Support**: For multi-instance/serverless deployments (commented with instructions)
- **Periodic Cleanup**: Automatic cleanup every 5 minutes
- **Standard Headers**: Returns proper rate limit headers (X-RateLimit-*)

## Quick Start

### Basic Usage

```typescript
import { checkSignupRateLimit } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  
  // Check rate limit
  const result = await checkSignupRateLimit(ipAddress)
  
  if (!result.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded', retryAfter: result.retryAfter },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '3600',
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toISOString()
        }
      }
    )
  }
  
  // Process request...
  console.log(`${result.remaining} requests remaining`)
}
```

## Pre-configured Rate Limits

### Signup Rate Limits
- **By IP**: 3 requests per hour
```typescript
const result = await checkSignupRateLimit(ipAddress)
```

### Verification Rate Limits
- **By IP**: 10 requests per hour
```typescript
const result = await checkVerificationRateLimit(ipAddress)
```

- **By Email**: Custom attempts (e.g., 4 attempts)
```typescript
const result = await checkVerificationAttempts(email, 4)
```

### Resend Rate Limits
- **By Email**: 3 requests per hour
```typescript
const result = await checkResendRateLimit(email)
```

- **By IP**: 10 requests per hour
```typescript
const result = await checkResendIPRateLimit(ipAddress)
```

### Email Sending Rate Limits
- **By Email**: 5 requests per hour
```typescript
const result = await checkEmailSendingRateLimit(email)
```

## Custom Rate Limits

```typescript
import { checkRateLimit } from '@/lib/rate-limiter'

const result = await checkRateLimit(
  `custom:${userId}`,  // identifier
  100,                 // max requests
  60 * 1000           // window in milliseconds (1 minute)
)

if (result.allowed) {
  console.log(`${result.remaining} requests remaining`)
} else {
  console.log(`Rate limited. Try again in ${result.retryAfter} seconds`)
}
```

## Rate Limit Result

```typescript
interface RateLimitResult {
  allowed: boolean           // Whether request is allowed
  remaining: number          // Remaining requests in window
  resetAt: Date             // When rate limit resets
  retryAfter?: number       // Seconds until next allowed request
}
```

## Production Deployment

### Single Instance (Default)

The system uses in-memory Map by default. Perfect for:
- Development
- Single-instance deployments
- Testing

No configuration needed!

### Multi-Instance with Redis

For production with multiple instances or serverless deployments:

1. **Install Redis client**:
```bash
npm install ioredis
```

OR for Upstash (serverless Redis):
```bash
npm install @upstash/redis
```

2. **Set environment variable**:
```env
REDIS_URL=redis://localhost:6379
```

3. **Uncomment Redis implementation** in `lib/rate-limiter.ts`:
   - Find the `RedisRateLimiter` class
   - Uncomment the class definition
   - Update `getRateLimiter()` to return `new RedisRateLimiter()`

4. **Why Redis?**
   - Multiple instances need shared state
   - In-memory Map is per-instance
   - Serverless functions have separate memory
   - Redis provides shared storage

### Example Redis Configuration

```typescript
// In lib/rate-limiter.ts, update getRateLimiter():
function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    // Replace this line:
    // rateLimiterInstance = new InMemoryRateLimiter()
    
    // With this:
    rateLimiterInstance = new RedisRateLimiter()
  }
  return rateLimiterInstance
}
```

## Implementation Details

### Sliding Window Algorithm

Unlike fixed window (where limits reset at fixed intervals), sliding window tracks every request:

```
Fixed Window (Hourly):
00:00 - 01:00: 100 requests
01:00 - 02:00: 100 requests

Problem: 200 requests at 00:59 and 01:00

Sliding Window:
Any 1-hour period: 100 requests

Solution: Counts requests in last hour from now
```

### Cleanup Strategy

- **Automatic**: Runs every 5 minutes
- **On-Demand**: Called during each check
- **TTL**: Redis uses TTL (Time To Live)
- **Memory Efficient**: Removes old entries

### Identifiers

Rate limits are scoped by identifier:
- `signup:ip:123.45.67.89`
- `verify:email:user@example.com`
- `resend:ip:123.45.67.89`

This allows multiple strategies per request.

## API Integration Examples

### Waitlist Signup

```typescript
// app/api/waitlist/route.ts
import { checkSignupRateLimit } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request)
  
  // Check IP-based rate limit
  const ipLimit = await checkSignupRateLimit(ipAddress)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': ipLimit.retryAfter?.toString() || '3600'
        }
      }
    )
  }
  
  // Continue with signup...
}
```

### Verification with Multiple Limits

```typescript
// app/api/verify-code/route.ts
import { 
  checkVerificationRateLimit,
  checkVerificationAttempts 
} from '@/lib/rate-limiter'
import { MAX_ATTEMPTS } from '@/config/constants'

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request)
  const { email, code } = await request.json()
  
  // Check IP rate limit
  const ipLimit = await checkVerificationRateLimit(ipAddress)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts from this IP' },
      { status: 429 }
    )
  }
  
  // Check email rate limit (4 attempts total)
  const emailLimit = await checkVerificationAttempts(email, MAX_ATTEMPTS)
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many attempts for this email',
        attemptsRemaining: emailLimit.remaining 
      },
      { status: 429 }
    )
  }
  
  // Continue with verification...
}
```

## Testing

### Manual Testing

```bash
# Test rate limit by making multiple requests
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/waitlist \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo ""
  sleep 1
done
```

### Unit Testing

```typescript
import { checkRateLimit, destroyRateLimiter } from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
  afterEach(() => {
    destroyRateLimiter() // Clean up between tests
  })

  it('should allow requests within limit', async () => {
    const result1 = await checkRateLimit('test:1', 3, 60000)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(2)
    
    const result2 = await checkRateLimit('test:1', 3, 60000)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(1)
  })
  
  it('should block requests exceeding limit', async () => {
    // Make 3 requests (limit is 3)
    await checkRateLimit('test:2', 3, 60000)
    await checkRateLimit('test:2', 3, 60000)
    await checkRateLimit('test:2', 3, 60000)
    
    // 4th request should be blocked
    const result = await checkRateLimit('test:2', 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeDefined()
  })
})
```

## Best Practices

1. **Early Return**: Check rate limits before any heavy operations
2. **Proper Headers**: Include retry-after and rate limit headers
3. **Separate Strategies**: Use different limits for IP vs email
4. **Logging**: Log rate limit hits for monitoring
5. **Monitoring**: Track rate limit metrics
6. **Graceful Degradation**: Don't fail on rate limit errors

## Troubleshooting

### Rate limiter not working

1. Check if rate limiter is properly imported
2. Verify identifier is unique
3. Check cleanup is running
4. For Redis: verify connection

### Memory issues

1. Reduce cleanup interval
2. Check for memory leaks
3. Use Redis for production

### Rate limits too strict/loose

Adjust in `config/constants.ts`:
```typescript
export const RATE_LIMITS = {
  SIGNUP_PER_IP_HOUR: 3,        // Adjust as needed
  VERIFY_PER_IP_HOUR: 10,       // Adjust as needed
  // ...
}
```

## Monitoring

Add monitoring for rate limit hits:

```typescript
const result = await checkSignupRateLimit(ipAddress)

if (!result.allowed) {
  console.warn('Rate limit hit', {
    ip: ipAddress,
    retryAfter: result.retryAfter,
    resetAt: result.resetAt
  })
  
  // Send to monitoring service (DataDog, New Relic, etc.)
  // monitoring.recordRateLimitHit('signup', ipAddress)
}
```

## Performance

- **In-memory**: ~0.1ms per check
- **Redis**: ~1-3ms per check (network dependent)
- **Memory usage**: Minimal (Map with timestamps)
- **CPU usage**: Negligible (filtering operations)

## Security Considerations

1. **IP Spoofing**: Use trusted proxies (x-forwarded-for)
2. **Distributed Attacks**: Consider GeoIP blocking
3. **Account Enumeration**: Don't reveal different error messages
4. **Bypass Attempts**: Use multiple rate limit strategies

## License

Part of the StartSpooling application.
