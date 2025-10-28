# Email System Overview

## Architecture

StartSpooling uses Resend as the email service provider with a custom-built email infrastructure that includes rate limiting, retry logic, and template management.

## Components

### 1. Email Service (`/lib/email.ts`)

Core email sending functionality with enterprise features:

**Key Functions:**
- `sendVerificationCode()` - Sends 6-digit verification codes
- `resendVerificationCode()` - Resends codes with rate limiting
- `sendConfirmationEmail()` - Sends post-verification confirmation
- `sendEmailWithRetry()` - Core sending function with exponential backoff
- `isEmailConfigured()` - Validates email configuration
- `getCompletionPercentage()` - Calculates project completion for confirmation email
- `getCrypticStatus()` - Rotates cryptic status messages

**Features:**
- Rate limiting (5 emails/hour per email, 10/hour per IP)
- Exponential backoff retry logic (3 attempts)
- IP and email-based tracking
- Comprehensive error handling
- Detailed logging

### 2. Email Templates (`/lib/email-templates.ts`)

Template generation for all email types:

**Templates:**
- `verificationCodeTemplate()` - 6-digit code with security warnings
- `confirmationEmailTemplate()` - Post-verification mysterious email

**Design Aesthetic:**
- Dark theme (black background)
- Monospace font (Courier New)
- Cyan accents (#00FFFF)
- Minimal, cyberpunk aesthetic
- ASCII art borders
- Both HTML and plain text versions

### 3. Rate Limiting (`/lib/rate-limit.ts`)

Prevents email abuse:

**Limits:**
- 5 emails per hour per email address
- 10 emails per hour per IP address
- Separate tracking for email and IP
- Resets hourly

**Storage:**
- In-memory tracking
- IP derived from request headers
- Used only for verification code resends
- Confirmation emails not rate limited (sent once per user)

### 4. Email-Related API Routes

**Verification Code:**
- `POST /api/waitlist` - Sends verification code on signup
- `POST /api/resend-code` - Resends verification code (rate limited)

**Confirmation Email:**
- Sent automatically from `/app/welcome/page.tsx` on successful verification
- No dedicated API route (sent from client-side)

**Preview (Development Only):**
- `GET /api/preview-confirmation-email` - Preview confirmation email

## Email Flow

### Verification Flow

1. User submits email on landing page
2. System generates 6-digit code
3. Code stored in database with expiration (15 minutes)
4. Verification email sent via Resend
5. User enters code on verification page
6. Code validated against database
7. User reaches welcome page

### Confirmation Flow

1. User reaches welcome page after verification
2. Welcome page triggers confirmation email send
3. Email sent asynchronously (doesn't block page)
4. User sees welcome message immediately
5. Confirmation email arrives in background
6. Email creates curiosity for return visits

## Configuration

### Environment Variables

Required:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx  # Resend API key
FROM_EMAIL=StartSpooling <no-reply@startspooling.com>  # From address
```

Optional:
```bash
NODE_ENV=production  # Enables/disables dev features
```

### Resend Setup

1. Domain verified: startspooling.com
2. DNS records configured: SPF, DKIM, DMARC
3. From address: no-reply@startspooling.com
4. Reply-to: support@startspooling.com (if configured)

## Email Types

### 1. Verification Code Email

**Purpose:** Deliver 6-digit verification code
**Trigger:** User signup
**Subject:** `startspooling verification`
**Rate Limited:** Yes (5/hour per email, 10/hour per IP)
**Template:** Dark theme, minimal, cyan code display

**Content:**
- 6-digit code in large cyan font
- 15-minute expiration warning
- Security warnings
- ASCII art borders

### 2. Confirmation Email

**Purpose:** Create mystery, encourage return visits
**Trigger:** Successful verification
**Subject:** `#[signup_number] archived`
**Rate Limited:** No (sent once per user)
**Template:** Dark theme, progress bar, cryptic messaging

**Content:**
- Signup number (creates FOMO)
- Archive confirmation
- Progress percentage (dynamic)
- Cryptic status message (rotates)
- Progress bar visualization
- Mysterious CTA about changes
- UTM-tracked link to site

**Dynamic Elements:**
- Completion percentage (based on milestone dates)
- Cryptic status (rotates based on signup number)
- Current date and timestamp
- Signup number with formatting

## Analytics Tracking

### Events Tracked

**Verification Emails:**
- Sent (existing tracking in verification flow)
- Delivered (Resend webhook)
- Opened (Resend tracking)

**Confirmation Emails:**
- `confirmation_email_sent` - Successfully sent
- `confirmation_email_failed` - Failed to send
- `email_link_clicked` - User clicked link in email (via UTM)

### UTM Parameters

Confirmation email links include:
```
?utm_source=confirmation_email
&utm_medium=email
&utm_campaign=waitlist
```

## Error Handling

### Verification Emails

Errors are critical (block user flow):
- Invalid email format → Show error to user
- Email send failure → Show error, allow retry
- Rate limit hit → Show error with countdown
- Resend configuration error → Log and alert

### Confirmation Emails

Errors are non-critical (silent failure):
- Email send failure → Log error, don't show user
- Invalid data → Log error, continue
- Resend unavailable → Log warning, continue
- User still sees welcome page regardless

## Monitoring

### Resend Dashboard

Monitor daily:
- Emails sent
- Delivery rate (target >95%)
- Bounce rate (target <5%)
- Spam reports (target <0.1%)
- Open rate
- Click rate

### Application Logs

Monitor for:
- Email send failures
- Rate limit hits
- Configuration errors
- Retry exhaustion

### Analytics

Track:
- Email send success rate
- Email-to-site click rate
- Return visit rate after email
- Time between email and return

## Rate Limits & Quotas

### Application Level

**Verification Codes:**
- 5 sends per hour per email
- 10 sends per hour per IP
- Enforced before Resend API call

**Confirmation Emails:**
- No rate limiting (sent once per user)

### Resend Level

**Free Tier:**
- 100 emails/day
- 3,000 emails/month

**Pro Tier ($20/month):**
- 50,000 emails/month
- $1 per additional 1,000

## Best Practices

### Development

- Use preview routes to test templates
- Test with real email addresses
- Check spam scores before launch
- Verify in multiple email clients
- Monitor rate limiting in logs

### Production

- Monitor Resend dashboard daily
- Set up delivery failure alerts
- Track email engagement metrics
- Rotate API keys periodically
- Keep templates lightweight
- Include plain text versions
- Always include unsubscribe link

## Troubleshooting

### Common Issues

**Emails not sending:**
1. Check RESEND_API_KEY is set
2. Verify domain in Resend
3. Check FROM_EMAIL matches verified domain
4. Review Resend dashboard for errors

**High spam rate:**
1. Verify SPF/DKIM/DMARC records
2. Review email content for spam triggers
3. Check domain reputation
4. Test with mail-tester.com

**Rate limiting issues:**
1. Check if hitting 5 emails/hour per email
2. Check if hitting 10 emails/hour per IP
3. Verify rate limit storage working
4. Consider increasing limits if legitimate traffic

## Future Enhancements

Potential additions:
- Email preferences management
- Unsubscribe handling
- Additional email types (announcements, updates)
- A/B testing framework
- Email scheduling
- Template versioning
- Email analytics dashboard

## File Reference

Key files in the email system:
```
/lib/email.ts                    # Core email service
/lib/email-templates.ts          # Email templates
/lib/rate-limit.ts              # Rate limiting
/lib/verification.ts            # Code generation
/app/api/waitlist/route.ts      # Signup endpoint
/app/api/resend-code/route.ts   # Resend endpoint
/app/welcome/page.tsx           # Triggers confirmation email
/app/api/preview-confirmation-email/route.ts  # Preview (dev only)
```

## Technical Implementation Details

### Email Service Architecture

The email system is built with a layered architecture:

1. **Template Layer** (`email-templates.ts`)
   - Pure template functions
   - No side effects
   - Returns HTML and plain text
   - Handles dynamic content generation

2. **Service Layer** (`email.ts`)
   - Business logic for email sending
   - Rate limiting integration
   - Retry logic implementation
   - Error handling and logging

3. **Infrastructure Layer** (Resend API)
   - Actual email delivery
   - Delivery tracking
   - Bounce handling
   - Webhook support

### Rate Limiting Implementation

Rate limiting uses in-memory storage with automatic cleanup:

```typescript
// Rate limiting configuration
const MAX_SENDS_PER_EMAIL_PER_HOUR = 5
const MAX_SENDS_PER_IP_PER_HOUR = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Storage structure
interface RateLimitEntry {
  timestamps: number[]
  count: number
}
```

### Retry Logic

Exponential backoff with jitter:

```typescript
// Retry configuration
const maxRetries = 2
const baseDelay = 1000 // 1 second

// Delay calculation
const delay = Math.pow(2, attempt) * baseDelay
```

### Template System

Templates use a consistent pattern:

```typescript
export function templateName(data: TemplateData): EmailTemplate {
  return {
    html: createHtmlTemplate(data),
    text: createPlainTextTemplate(data)
  }
}
```

## Security Considerations

### Email Privacy

- Email addresses are hashed before analytics tracking
- No sensitive data in email templates
- Rate limiting prevents abuse
- Verification codes expire quickly (15 minutes)

### Content Security

- All email content is sanitized
- No user-generated content in emails
- Static templates prevent injection
- UTM parameters are validated

### Infrastructure Security

- API keys stored in environment variables
- Domain verification required
- SPF/DKIM/DMARC records configured
- HTTPS-only email links

## Performance Optimization

### Email Sending

- Asynchronous sending (non-blocking)
- Connection pooling via Resend
- Retry logic prevents unnecessary API calls
- Rate limiting reduces server load

### Template Rendering

- Templates are pre-compiled
- No runtime template compilation
- Minimal HTML for faster rendering
- Inline styles for email client compatibility

### Monitoring Performance

- Email send latency tracking
- Success rate monitoring
- Rate limit hit tracking
- Retry attempt logging

## Integration Points

### Database Integration

- Verification codes stored in database
- User signup tracking
- Email send history (if implemented)
- Analytics event storage

### Analytics Integration

- Email send events tracked
- Click-through tracking via UTM
- User journey mapping
- Conversion funnel analysis

### External Services

- Resend API for email delivery
- Google Analytics for tracking
- Domain DNS for email authentication
- Monitoring services for alerts
