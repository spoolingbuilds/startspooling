# Middleware Security Documentation

## Overview

The middleware (`middleware.ts`) provides comprehensive route protection and security features for the StartSpooling waitlist application.

## Protected Routes

### `/verify` Route Protection
- **Access Requirements**: 
  - Email query parameter OR valid session cookie
  - Email must exist in database with unverified status
  - Account must not be locked
  - Verification code must not be expired (15 minutes)
- **Redirects**: 
  - Missing email → `/`
  - Already verified → `/welcome`
  - Account locked → `/`
  - Code expired → `/`

### `/welcome` Route Protection
- **Access Requirements**:
  - Valid `welcomeMessageId` query parameter (1-30)
  - Must correspond to a verified signup in database
  - Verification must be recent (within 1 hour)
- **Redirects**:
  - Missing or invalid ID → `/`
  - No verified signup found → `/`
  - Verification too old → `/`

## Rate Limiting

### API Routes
- **Per IP**: 30 requests/minute, 1000 requests/hour
- **Per Email**: 10 requests/minute, 100 requests/hour
- **Verification Attempts**: 20 attempts/hour per email

### Implementation
- In-memory store for development (use Redis in production)
- Automatic cleanup of expired records
- Separate tracking for different time windows

## Session Management

### Session Cookie
- **Name**: `spool_session`
- **Duration**: 1 hour
- **Security**: HttpOnly, Secure (production), SameSite=Lax
- **Content**: Base64 encoded JSON with email, timestamp, verified status

### Session Flow
1. **Signup**: Cookie set with `verified: false`
2. **Verification Success**: Cookie updated with `verified: true`
3. **Welcome Page**: Session marked as verified
4. **Expiry**: Automatic cleanup after 1 hour

## Security Headers

Applied to all responses:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`: Restrictive CSP for XSS protection

## Database Integration

### Verification Access Check
```typescript
// Checks:
// - Email exists in database
// - Account not locked
// - Code not expired (15 minutes)
// - Verification status
```

### Welcome Access Check
```typescript
// Checks:
// - Valid welcomeMessageId (1-30)
// - Corresponding verified signup exists
// - Verification is recent (1 hour)
```

## Configuration

### Rate Limiting
```typescript
const RATE_LIMIT_CONFIG = {
  IP_REQUESTS_PER_MINUTE: 30,
  IP_REQUESTS_PER_HOUR: 1000,
  EMAIL_REQUESTS_PER_MINUTE: 10,
  EMAIL_REQUESTS_PER_HOUR: 100,
  VERIFICATION_ATTEMPTS_PER_HOUR: 20,
}
```

### Session
```typescript
const SESSION_CONFIG = {
  COOKIE_NAME: 'spool_session',
  MAX_AGE: 60 * 60 * 1000, // 1 hour
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax',
}
```

## Usage Examples

### Setting Session Cookie (API Route)
```typescript
import { setSessionCookie } from '@/lib/session'

const response = NextResponse.json({ success: true })
setSessionCookie(response, email, false) // unverified
return response
```

### Getting Session (API Route)
```typescript
import { getSessionFromCookie } from '@/lib/session'

const session = getSessionFromCookie(request)
if (session?.verified) {
  // User is verified
}
```

## Security Considerations

1. **Query Parameter Encryption**: Currently using base64 (upgrade to proper encryption in production)
2. **Rate Limiting**: In-memory store (use Redis for production)
3. **Session Security**: HttpOnly cookies prevent XSS access
4. **Database Validation**: All access checks query the database
5. **Time-based Expiry**: Multiple layers of time-based validation

## Production Recommendations

1. **Use Redis** for rate limiting storage
2. **Implement proper encryption** for query parameters
3. **Add monitoring** for rate limit violations
4. **Consider CDN integration** for IP-based rate limiting
5. **Add audit logging** for security events
6. **Implement CSRF protection** for state-changing operations
