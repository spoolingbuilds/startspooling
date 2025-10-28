# Confirmation Email Testing Guide

## Overview

The confirmation email system is built on top of the existing Resend infrastructure used for verification codes. It reuses the same configuration, rate limiting, and error handling patterns.

## Prerequisites

The existing email system must be working:
- Resend API key configured (RESEND_API_KEY)
- FROM_EMAIL configured
- Verification code emails working
- Domain verified in Resend

## Local Development Testing

### 1. Preview Email Without Sending

Visit the preview endpoint to see how the email looks:
```bash
# Default preview (signup #1234)
http://localhost:3000/api/preview-confirmation-email

# Different signup numbers (shows different cryptic statuses)
http://localhost:3000/api/preview-confirmation-email?signup=1
http://localhost:3000/api/preview-confirmation-email?signup=100
http://localhost:3000/api/preview-confirmation-email?signup=1000
http://localhost:3000/api/preview-confirmation-email?signup=5000

# Plain text version
http://localhost:3000/api/preview-confirmation-email?format=text

# Custom total signups
http://localhost:3000/api/preview-confirmation-email?signup=42&total=10000
```

Verify:
- [ ] Email renders correctly in browser
- [ ] Dark theme with cyan accents matches site aesthetic
- [ ] Progress bar displays correctly
- [ ] Signup number formats with commas
- [ ] Cryptic status rotates based on signup number
- [ ] All dynamic data populates
- [ ] Links include UTM parameters
- [ ] Unsubscribe link present

### 2. Test Actual Email Sending

Go through the complete signup flow:

1. Start development server: `npm run dev`
2. Go to http://localhost:3000
3. Enter your email and submit
4. Check email for verification code
5. Enter verification code
6. Reach welcome page
7. Check inbox for confirmation email

Expected behavior:
- Confirmation email arrives within 1 minute
- Email appears in inbox (not spam)
- Renders correctly in your email client
- All links work
- UTM tracking parameters present

### 3. Check Logs

Monitor console output:
- "Confirmation email sent to [email]" = success
- "Failed to send confirmation email" = failure (check error message)
- Any email sending errors should be logged

### 4. Verify Email Content

Check the confirmation email includes:
- [ ] Subject: "Archived"
- [ ] Signup number displayed correctly
- [ ] Current date
- [ ] Timestamp in UTC
- [ ] Progress percentage (dynamic based on milestones)
- [ ] Cryptic status message
- [ ] Progress bar visual
- [ ] Link to startspooling.com with UTM parameters
- [ ] Unsubscribe link
- [ ] Plain text version (check "Show original" in Gmail)

## Testing in Multiple Email Clients

Test rendering in:
- [ ] Gmail (web)
- [ ] Gmail (mobile app)
- [ ] Outlook (web)
- [ ] Apple Mail (desktop)
- [ ] Apple Mail (iPhone)
- [ ] Outlook (desktop)

Common issues to check:
- Progress bar renders (may show as colored div)
- Borders display correctly
- Font renders as monospace
- Links are clickable
- Dark background displays

## Analytics Verification

Check that analytics events fire:

1. **Email Sent Event:**
   - Event name: `confirmation_email_sent`
   - Properties: signup_number, email_hash, timestamp

2. **Email Failed Event:**
   - Event name: `confirmation_email_failed`
   - Properties: signup_number, email_hash, error_type, timestamp

3. **Email Link Click:**
   - Event name: `email_link_clicked`
   - Properties: email_source, timestamp
   - Triggered when user clicks link in email

## Production Testing

### After Deployment

1. **First Live Test:**
   - Complete signup flow with test email
   - Verify confirmation email received
   - Check all links work
   - Verify analytics events tracked
   - Check Resend dashboard for delivery status

2. **Monitor Resend Dashboard:**
   - Go to https://resend.com/emails
   - Check delivery status
   - Monitor bounce rate (should be <5%)
   - Check spam reports (should be 0)

3. **Check Analytics:**
   - Verify events appear in Google Analytics
   - Check email send success rate
   - Monitor email link click rate

## Completion Percentage Testing

The completion percentage is dynamic based on project milestones:

Current milestones:
- 2025-01-01: 0% (project start)
- 2025-02-15: 25% (waitlist phase)
- 2025-03-30: 50% (beta ready)
- 2025-05-15: 75% (feature complete)
- 2025-06-30: 100% (public launch)

Test at different dates:
```typescript
// In getCompletionPercentage() function
// Temporarily change dates for testing
const now = new Date('2025-02-01') // Should show ~12%
const now = new Date('2025-04-15') // Should show ~62%
```

## Cryptic Status Testing

10 status messages rotate based on signup number:
```
#1, #11, #21 → "building in progress"
#2, #12, #22 → "compiling memories"
#3, #13, #23 → "archive expanding"
... and so on
```

Test by previewing different signup numbers:
- /api/preview-confirmation-email?signup=1
- /api/preview-confirmation-email?signup=2
- /api/preview-confirmation-email?signup=10

## Common Issues & Solutions

### Issue: Confirmation email not sent

**Check:**
1. Did verification code email work? (If not, email system isn't configured)
2. Check console for error messages
3. Check Resend dashboard for failed sends
4. Verify RESEND_API_KEY is set
5. Check welcome page console logs

**Solution:**
- If verification emails work, confirmation should too (same infrastructure)
- Check welcome page is calling sendConfirmationEmail()
- Check for rate limiting (though confirmation emails aren't rate limited)

### Issue: Email goes to spam

**Check:**
1. Are verification emails also going to spam?
2. Is domain verified in Resend?
3. Are SPF/DKIM records configured?

**Solution:**
- This should be resolved at the domain level
- If verification emails work, confirmation emails should too
- Both use same From address and configuration

### Issue: Email renders poorly

**Check:**
1. Which email client?
2. Does preview route look correct?
3. Are inline styles present?

**Solution:**
- Email uses inline styles (required for email clients)
- Matches verification email aesthetic
- Test in multiple clients

### Issue: Links don't work

**Check:**
1. Are URLs absolute? (https://startspooling.com)
2. Do UTM parameters work?
3. Can you click links in browser preview?

**Solution:**
- All URLs are absolute
- UTM parameters format: ?utm_source=confirmation_email&utm_medium=email
- Test by clicking in actual email

## Integration Testing Checklist

Before marking as complete:

- [ ] Preview route works in development
- [ ] Email template matches site aesthetic
- [ ] Reuses existing email infrastructure
- [ ] Doesn't duplicate code from verification emails
- [ ] Sends from same From address as verification
- [ ] Rate limiting not needed (only sent once)
- [ ] Error handling follows existing patterns
- [ ] Logging follows existing patterns
- [ ] Analytics events tracked
- [ ] UTM parameters added to links
- [ ] Plain text version included
- [ ] Unsubscribe link present
- [ ] Tested in multiple email clients
- [ ] Successfully sent in development
- [ ] Welcome page not blocked by email sending
- [ ] Silent failure if email doesn't send
- [ ] No errors shown to user

## Metrics to Monitor

After launch, track:

### Email Performance
- Send success rate (>99% expected)
- Delivery rate (>95% expected, same as verification emails)
- Open rate (>40% target for transactional)
- Click-through rate (>20% target)

### User Behavior
- Time between verification and email open
- Return visits after email
- Viral sharing (screenshots on social media)
- Forum discussions mentioning the email

### Technical Metrics
- Email send latency (<5 seconds)
- Failed sends (<1%)
- Analytics event fire rate (should be 100% of sends)

## Success Criteria

Confirmation email system is successful when:

- ✅ Emails send reliably (>99% success rate)
- ✅ Users receive emails quickly (<1 minute)
- ✅ Emails render correctly in major clients
- ✅ Click-through rate >20%
- ✅ Creates curiosity and return visits
- ✅ Social sharing observed (screenshots)
- ✅ No spam reports
- ✅ Analytics tracking works

## Testing Commands

### Quick Test Script
```bash
# Test email template compilation
npm run build

# Test in development
npm run dev

# Check email configuration
echo "RESEND_API_KEY: $RESEND_API_KEY"
echo "FROM_EMAIL: $FROM_EMAIL"
```

### Manual Testing Flow
1. **Setup**: Ensure email system works (test verification code first)
2. **Signup**: Complete full signup flow
3. **Verify**: Check confirmation email received
4. **Content**: Verify email content and styling
5. **Links**: Test all links work
6. **Analytics**: Check events fired
7. **Clients**: Test in multiple email clients

### Debug Commands
```bash
# Check if email service is configured
curl http://localhost:3000/api/test-db

# Check analytics events (in browser console)
console.log('[Analytics] confirmation_email_sent', {...})

# Check Resend dashboard
open https://resend.com/emails
```

## Notes

- Confirmation emails use the same infrastructure as verification emails
- Rate limiting applies (5 emails/hour per email, 10 per IP)
- Email sending is asynchronous and non-blocking
- Analytics tracking is automatic and comprehensive
- Template follows existing cyberpunk aesthetic
- All links include proper UTM tracking parameters
