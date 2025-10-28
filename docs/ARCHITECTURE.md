# Architecture Documentation

Complete technical overview of the StartSpooling waitlist application architecture.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Verification Flow](#verification-flow)
- [Rate Limiting Strategy](#rate-limiting-strategy)
- [Security Considerations](#security-considerations)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)

## Overview

The StartSpooling waitlist is a production-ready Next.js 14 application with email verification. It includes sophisticated rate limiting, security measures, and user experience optimizations.

### Key Features

- Email verification with time-limited codes
- Multi-layered rate limiting
- Account lockout after failed attempts
- Security headers and HTTPS enforcement
- Responsive design
- Production-ready error handling

## System Architecture

### High-Level Flow

```
User → Next.js Frontend → API Routes → Database
                      ↓
                  Email Service (Resend)
                      ↓
                  User Email
```

### Components

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                         │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js Application                     │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │ Middleware   │───▶│ API Routes   │───▶│ Database  │ │
│  │ - Rate Limit │    │ - Business   │    │ Prisma    │ │
│  │ - Security   │    │   Logic      │    │ PostgreSQL│ │
│  │ - Session    │    │ - Validation │    │           │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │ Email Service Integration                    │        │
│  │ - Resend API                                 │        │
│  │ - Templates                                  │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Request** → Middleware intercepts
   - Rate limiting check
   - Security headers
   - Session validation
   - Route protection

2. **API Request** → Business logic
   - Input validation
   - Database operations
   - Email sending
   - Response formatting

3. **Database** → Data persistence
   - User data
   - Verification attempts
   - Session management

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────┐
│       WaitlistSignup                    │
├─────────────────────────────────────────┤
│ + id: String (PK)                       │
│ + email: String (unique)               │
│ + verificationCode: String              │
│ + verificationAttempts: Int             │
│ + lockedUntil: DateTime?               │
│ + isVerified: Boolean                   │
│ + verifiedAt: DateTime?                │
│ + welcomeMessageId: Int                 │
│ + browserClient: String                 │
│ + ipAddress: String                    │
│ + spoolTag: String                     │
│ + referralSource: String?              │
│ + createdAt: DateTime                   │
│ + updatedAt: DateTime                   │
└─────────────────────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────────────────┐
│     VerificationAttempt                  │
├─────────────────────────────────────────┤
│ + id: String (PK)                       │
│ + email: String                         │
│ + attemptedCode: String                 │
│ + wasSuccessful: Boolean                │
│ + ipAddress: String                     │
│ + timestamp: DateTime                   │
└─────────────────────────────────────────┘
```

### Tables

#### WaitlistSignup

Primary table storing waitlist signups and verification state.

**Indexes:**
- `email` - Unique constraint for lookups
- `lockedUntil` - For filtering locked accounts
- `(email, isVerified)` - Composite index for verification queries
- `(ipAddress, createdAt)` - For rate limiting queries

**Key Fields:**
- `verificationCode`: 6-character alphanumeric code
- `verificationAttempts`: Counter for failed attempts (0-4)
- `lockedUntil`: Timestamp when lock expires (null if not locked)
- `isVerified`: Boolean flag for verification status
- `welcomeMessageId`: Random 1-30 for personalized messages

#### VerificationAttempt

Audit log of all verification attempts for security and monitoring.

**Indexes:**
- `email` - For filtering attempts by user
- `timestamp` - For time-based queries

**Special Codes:**
- Normal: 6-character verification codes
- `RESEND`: Marker for resend requests in rate limiting

## Verification Flow

### Complete User Journey

```
1. SIGNUP
   User enters email
      ↓
   Validate email format
      ↓
   Check rate limits (IP + Email)
      ↓
   Check if email exists
      ├─ Exists + Verified: Return success (hide existence)
      ├─ Exists + Unverified: Generate new code
      └─ New: Create signup record
      ↓
   Generate 6-char code
      ↓
   Send email via Resend
      ↓
   Set session cookie
      ↓
   Redirect to /verify

2. VERIFICATION
   User enters code
      ↓
   Validate code format
      ↓
   Check if already verified
      ↓
   Check if account locked
      ├─ Locked: Return lock time remaining
      └─ Not locked: Continue
      ↓
   Check if code expired
      ├─ Expired: Return "Request new code"
      └─ Valid: Continue
      ↓
   Compare codes
      ├─ Match: Verify account
      │    ├─ Set isVerified = true
      │    ├─ Set verifiedAt = now
      │    ├─ Reset attempts
      │    └─ Set welcomeMessageId (1-30)
      │
      └─ Mismatch: Increment attempts
           ├─ If attempts >= 4: Lock account (1 hour)
           └─ Return attempts remaining

3. SUCCESS
   Verified user
      ↓
   Set session cookie (verified = true)
      ↓
   Redirect to /welcome?id=X
      ↓
   Display personalized message

4. RESEND (if needed)
   User requests new code
      ↓
   Check if verified (reject if yes)
      ↓
   Check if locked (reject if yes)
      ↓
   Check rate limits (3/hour per email)
      ↓
   Generate new code
      ↓
   Reset attempts
      ↓
   Remove lock
      ↓
   Send new email
      ↓
   Log as "RESEND" attempt
```

### State Machine

```
UNVERIFIED ────(enter code)───▶ VERIFYING
    │                               │
    │ (wrong)                        │ (correct)
    ▼                               ▼
INVALID_CODE                    VERIFIED
    │                               │
    │ (4 times)                     │
    ▼                               │
LOCKED ◀──────────────────────────┘
    │
    │ (1 hour)
    ▼
UNLOCKED ──(resend code)──▶ UNVERIFIED
```

## Rate Limiting Strategy

### Multi-Layer Protection

```
┌─────────────────────────────────────────────┐
│ Layer 1: Middleware (Per-Request)            │
│ - IP-based: 30/minute, 1000/hour            │
│ - Email-based: 10/minute, 100/hour         │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Layer 2: Endpoint-Specific                  │
│ - Signup: 3/hour per IP, 5/hour per email  │
│ - Verify: 10/hour per IP                   │
│ - Resend: 10/hour per IP, 3/hour per email │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Layer 3: Email Sending                       │
│ - 5/hour per email                          │
│ - 10/hour per IP                            │
└─────────────────────────────────────────────┘
```

### Rate Limit Storage

**In-Memory (Development):**
```typescript
Map<string, {
  count: number;
  resetTime: number;
  timestamps: number[];
}>
```

**Redis (Production - Optional):**
```typescript
// Key format: "ratelimit:type:identifier"
// Value: JSON of timestamps
// TTL: Automatic via Redis
```

### Cleanup Strategy

- Automatic cleanup runs periodically
- Removes entries older than rate limit window
- Prevents memory leaks
- Maintains performance

## Security Considerations

### Input Validation

```typescript
// Email validation
emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Code validation
codeRegex = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/

// Sanitization
sanitizeCode(code) {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}
```

### Security Headers

All responses include:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self' ...
```

### HTTPS Enforcement

- HTTPS required in production
- HTTP redirects to HTTPS
- Secure cookies only in production

### Session Management

```typescript
Session = {
  email: string;
  timestamp: number;
  verified: boolean;
}

Cookie = {
  name: 'spool_session';
  httpOnly: true;
  secure: true; // Production only
  sameSite: 'lax';
  maxAge: 3600000; // 1 hour
}
```

### Protection Against Attacks

1. **SQL Injection**: Prisma ORM with parameterized queries
2. **XSS**: Input sanitization and CSP headers
3. **CSRF**: SameSite cookies and CSRF tokens
4. **Enumeration**: Generic error messages
5. **Brute Force**: Rate limiting and account lockout
6. **Spam**: Email rate limiting
7. **Distributed Attacks**: Redis rate limiting (optional)

## Technology Stack

### Frontend

- **Next.js 14**: App Router for routing
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

### Backend

- **Next.js API Routes**: Server-side logic
- **Prisma**: ORM and database client
- **PostgreSQL**: Database
- **Resend**: Email service

### DevOps

- **Vercel**: Hosting and deployment
- **GitHub**: Version control
- **Prisma Migrations**: Database versioning

### Infrastructure

```
┌─────────────────────────────┐
│         Vercel CDN          │
│   (Global Edge Network)     │
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│     Next.js Application     │
│  - Server-side rendering    │
│  - API routes               │
│  - Edge functions           │
└─────────────────────────────┘
              │
         ┌────┴────┐
         ▼         ▼
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │   Resend     │
│  Database    │  │  Email API    │
└──────────────┘  └──────────────┘
```

## Project Structure

```
startspooling-waitlist/
├── app/                          # Next.js 14 App Router
│   ├── api/                     # API endpoints
│   │   ├── waitlist/
│   │   │   └── route.ts         # Signup endpoint
│   │   ├── verify-code/
│   │   │   └── route.ts         # Verification endpoint
│   │   └── resend-code/
│   │       └── route.ts         # Resend endpoint
│   ├── verify/                   # Verification page
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── welcome/                  # Success page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── error.tsx                 # Error boundary
│   └── loading.tsx                # Loading UI
├── components/                   # React components
│   ├── WaitlistForm.tsx         # Email signup form
│   ├── EmailForm.tsx            # Email input component
│   ├── SpoolAnimation.tsx       # Logo animation
│   ├── ErrorMessage.tsx          # Error display
│   ├── LoadingSpinner.tsx        # Loading state
│   ├── OfflineBanner.tsx        # Offline indicator
│   └── icons.tsx                 # Icon exports
├── lib/                          # Utility functions
│   ├── prisma.ts                 # Database client
│   ├── db.ts                     # DB operations
│   ├── verification.ts            # Verification logic
│   ├── email.ts                  # Email sending
│   ├── rate-limit.ts             # Rate limiting
│   ├── rate-limiter.ts           # Advanced rate limiter
│   ├── api-helpers.ts            # API utilities
│   ├── validation.ts             # Input validation
│   ├── session.ts                # Session management
│   └── utils.ts                  # General utilities
├── config/                       # Configuration
│   ├── constants.ts              # App constants
│   └── site.ts                   # Site configuration
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── dev.db                    # Local DB (dev only)
├── docs/                         # Documentation
│   ├── API.md                    # API reference
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── ARCHITECTURE.md           # This file
├── middleware.ts                 # Next.js middleware
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config
└── vercel.json                   # Vercel configuration
```

## Data Flow Examples

### Signup Flow

```typescript
1. User submits email
   ↓
2. API validates format
   ↓
3. Check rate limits
   ├─ IP rate limit: 3/hour
   └─ Email rate limit: 5/hour
   ↓
4. Query database for existing email
   ├─ Not found: Create new signup
   └─ Found: Update code
   ↓
5. Generate 6-char code
   ↓
6. Send email via Resend
   ↓
7. Set session cookie
   ↓
8. Return success response
```

### Verification Flow

```typescript
1. User submits code
   ↓
2. Sanitize code (uppercase, trim)
   ↓
3. Query database for signup
   ↓
4. Validate state
   ├─ Already verified? → Error
   ├─ Account locked? → Return lock time
   └─ Code expired? → Error
   ↓
5. Compare codes
   ├─ Match: Update database
   │    ├─ Set isVerified = true
   │    ├─ Set verifiedAt = now
   │    ├─ Set welcomeMessageId = random(1-30)
   │    └─ Reset attempts
   │
   └─ Mismatch: Increment attempts
        ├─ attempts >= 4 → Lock account
        └─ Return attempts remaining
```

## Performance Optimizations

1. **Database Indexing**: Strategic indexes on frequently queried fields
2. **Code Splitting**: Dynamic imports for large components
3. **Image Optimization**: Next.js automatic image optimization
4. **Edge Caching**: Vercel edge caching for static assets
5. **Prisma Connection Pooling**: Efficient database connections
6. **Rate Limit Cleanup**: Periodic cleanup to prevent memory leaks

## Monitoring & Observability

### Metrics to Monitor

- Signup rate
- Verification success rate
- Failed verification attempts
- Rate limit hits
- Email delivery rate
- API response times
- Database query performance
- Error rates

### Logging

- All verification attempts logged
- Rate limit hits logged
- Email sending status logged
- Errors logged with context

## Future Enhancements

- [ ] Redis for distributed rate limiting
- [ ] Email analytics dashboard
- [ ] A/B testing for welcome messages
- [ ] SMS verification option
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Admin dashboard

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Maintainer:** StartSpooling Team

