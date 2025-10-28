# API Documentation

Complete API reference for the StartSpooling waitlist application.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Waitlist Signup](#waitlist-signup)
  - [Verify Code](#verify-code)
  - [Resend Code](#resend-code)
- [Error Codes](#error-codes)
- [Examples](#examples)

## Base URL

**Production:** `https://yourdomain.com`

**Development:** `http://localhost:3000`

All API endpoints are prefixed with `/api`.

## Authentication

Currently, the API uses session-based authentication via HTTP-only cookies. No API keys required.

Session cookies are set automatically after signup and contain:
- Email address
- Verification status
- Timestamp

## Rate Limiting

Rate limits are applied per IP and per email to prevent abuse:

| Endpoint        | Per IP    | Per Email | Window  |
|----------------|-----------|-----------|---------|
| `/api/waitlist` | 3 requests| 5 requests| 1 hour  |
| `/api/verify-code` | 10 requests | N/A | 1 hour |
| `/api/resend-code` | 10 requests | 3 requests | 1 hour |

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1234567890
Retry-After: 3600
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "success": false
}
```

Status Code: `429 Too Many Requests`

## Endpoints

### Waitlist Signup

Create a new waitlist signup with email verification.

**Endpoint:** `POST /api/waitlist`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "referralSource": "twitter"  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "check your email. code sent.",
  "email": "us***@example.com"  // Masked email
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "Email is required",
  "success": false
}
```

```json
{
  "error": "Invalid email format",
  "success": false
}
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "success": false
}
```

```json
{
  "error": "Account temporarily locked. Please try again later.",
  "success": false
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create signup",
  "success": false
}
```

**Behavior:**
- If email already exists and is unverified, generates a new code and sends it
- If email already exists and is verified, returns success without revealing email exists
- Normalizes email (lowercase, trim)
- Validates email format
- Applies rate limiting by IP and email
- Sends verification code via email

---

### Verify Code

Verify the email address with a 6-character code.

**Endpoint:** `POST /api/verify-code`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "ABC123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "verified": true,
  "welcomeMessageId": 15,
  "message": "Verified. Welcome."
}
```

The `welcomeMessageId` is a random number between 1-30 used for personalized welcome messages.

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "verified": false,
  "message": "Email is required"
}
```

```json
{
  "success": false,
  "verified": false,
  "message": "Code is required"
}
```

```json
{
  "success": false,
  "verified": false,
  "message": "Invalid code format"
}
```

```json
{
  "success": false,
  "verified": false,
  "message": "Verification failed"
}
```

```json
{
  "success": false,
  "verified": false,
  "message": "Already verified"
}
```

```json
{
  "success": false,
  "verified": false,
  "message": "Code expired. Request new one."
}
```

```json
{
  "success": false,
  "verified": false,
  "attemptsRemaining": 2,
  "message": "Incorrect code. 2 attempts remaining."
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "locked": true,
  "lockTimeRemaining": 3600000,
  "message": "Locked. Try again in 60 minutes."
}
```

**Behavior:**
- Codes expire after 15 minutes from creation
- After 4 failed attempts, account is locked for 1 hour
- Code is case-insensitive (automatic uppercasing)
- Returns number of attempts remaining
- On success, account is marked as verified

---

### Resend Code

Request a new verification code for an unverified email.

**Endpoint:** `POST /api/resend-code`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "new code sent. check your email."
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "already verified"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "no signup found with that email"
}
```

**423 Locked:**
```json
{
  "success": false,
  "message": "account locked. try again in 60 minutes.",
  "lockUntil": "2024-01-01T12:00:00Z"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "message": "too many resend attempts. wait 45 minutes."
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "failed to send email"
}
```

**Behavior:**
- Generates a new 6-character code
- Resets verification attempts counter
- Removes account lock if present
- Enforces rate limiting (3 resends per hour per email)
- Returns 404 if email doesn't exist (security)
- Returns 400 if already verified

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200  | Success | Request completed successfully |
| 400  | Bad Request | Invalid input or business logic error |
| 404  | Not Found | Resource doesn't exist |
| 423  | Locked | Account is temporarily locked |
| 429  | Too Many Requests | Rate limit exceeded |
| 500  | Internal Server Error | Server error occurred |

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional info"  // Optional
}
```

### Common Error Messages

- `"Email is required"` - Email field is missing or empty
- `"Invalid email format"` - Email doesn't match valid format
- `"Code is required"` - Code field is missing or empty
- `"Invalid code format"` - Code is not 6 characters
- `"Already verified"` - Account is already verified
- `"Code expired. Request new one."` - Code expired (15 minutes)
- `"Rate limit exceeded"` - Too many requests
- `"Account temporarily locked"` - Account locked after 4 failed attempts
- `"Verification failed"` - General verification error
- `"Failed to send email"` - Email service error
- `"Internal server error"` - Unexpected server error

---

## Examples

### Complete Flow with cURL

#### 1. Sign Up

```bash
curl -X POST https://yourdomain.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "referralSource": "twitter"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "check your email. code sent.",
  "email": "us***@example.com"
}
```

#### 2. Verify Code

```bash
curl -X POST https://yourdomain.com/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "ABC123"
  }'
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "welcomeMessageId": 15,
  "message": "Verified. Welcome."
}
```

#### 3. Resend Code (if needed)

```bash
curl -X POST https://yourdomain.com/api/resend-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "new code sent. check your email."
}
```

### Rate Limit Example

```bash
# First request
curl -X POST https://yourdomain.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com"}'

# Response includes headers:
# X-RateLimit-Limit: 3
# X-RateLimit-Remaining: 2

# After exceeding limit:
# Response: 429 Too Many Requests
# Body: {"error": "Rate limit exceeded. Please try again later.", "success": false}
```

### Error Handling Example

```bash
# Invalid email format
curl -X POST https://yourdomain.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}'

# Response (400):
# {"error": "Invalid email format", "success": false}

# Missing code
curl -X POST https://yourdomain.com/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Response (400):
# {"success": false, "verified": false, "message": "Code is required"}
```

### Lockout Example

```bash
# After 4 failed attempts:
curl -X POST https://yourdomain.com/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "WRONG5"
  }'

# Response (400):
# {
#   "success": false,
#   "verified": false,
#   "attemptsRemaining": 0,
#   "message": "Too many failed attempts. Account locked. Try again in 1 hour.",
#   "locked": true
# }
```

### JavaScript/TypeScript Example

```typescript
async function signup(email: string, referralSource?: string) {
  const response = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, referralSource })
  });
  
  const data = await response.json();
  return data;
}

async function verifyCode(email: string, code: string) {
  const response = await fetch('/api/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  
  const data = await response.json();
  return data;
}

// Usage
try {
  const result = await signup('user@example.com', 'twitter');
  if (result.success) {
    console.log('Check your email for code');
  }
} catch (error) {
  console.error('Signup failed:', error);
}
```

---

## Security Considerations

1. **Rate Limiting**: All endpoints are rate-limited to prevent abuse
2. **Input Validation**: All inputs are validated and sanitized
3. **Email Masking**: Email addresses are masked in responses
4. **Account Lockout**: Accounts are locked after failed attempts
5. **Code Expiry**: Verification codes expire after 15 minutes
6. **HTTPS Only**: All production requests must use HTTPS
7. **No Enumeration**: API doesn't reveal if email exists
8. **SQL Injection**: Protected by Prisma ORM
9. **XSS Prevention**: All inputs are sanitized
10. **CORS**: Configured for production domain only

---

## Support

For API support:
- Email: support@startspooling.com
- Documentation: https://github.com/startspooling/waitlist
- Issues: https://github.com/startspooling/waitlist/issues

