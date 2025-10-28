# Email Setup Debug Guide

## Problem
Email submissions are succeeding in the API but emails are not being received.

## Root Cause
The `RESEND_API_KEY` in `.env.local` is set to the placeholder value `"your_resend_api_key_here"` instead of an actual API key from Resend.

## Solution

### Step 1: Get a Resend API Key

1. **Sign up for Resend** (if you haven't already):
   - Go to https://resend.com
   - Click "Sign Up" and create an account
   - Verify your email address

2. **Create an API Key**:
   - Log in to your Resend dashboard
   - Navigate to **API Keys** (or https://resend.com/api-keys)
   - Click **Create API Key**
   - Give it a name (e.g., "StartSpooling Dev")
   - Copy the API key (you'll only see it once!)

3. **Update `.env.local`**:
   ```bash
   # In your project root
   nano .env.local  # or use your preferred editor
   ```
   
   Update the `RESEND_API_KEY` line:
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"  # Your actual API key
   ```

### Step 2: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then start it again
npm run dev
```

### Step 3: Test Email Delivery

```bash
# Test with curl
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'

# Or test in the browser at http://localhost:3000
```

### Step 4: Check Email Delivery

1. Check your inbox (and spam folder!)
2. Check the Resend dashboard for delivery status
3. Check server logs for any errors

## Verification Steps

### ✅ Configuration Check

The application now includes automatic configuration checking:

```typescript
// Check if email service is configured
isEmailConfigured() // Returns true if API key is valid
```

### ✅ Error Messages

You should now see clear error messages if emails fail:

- **Missing API Key**: "Email service not configured. Please set RESEND_API_KEY in .env.local"
- **Invalid API Key**: Resend API will return specific error details
- **Email Sent Successfully**: "✓ Successfully sent to {email}"

### ✅ Logging

Check server logs for:

```
[Email] ✓ Successfully sent to virtualpete@gmail.com
[Email] ❌ Failed to send to virtualpete@gmail.com: {error details}
```

## Troubleshooting

### Issue: Still not receiving emails

1. **Check Resend Dashboard**:
   - Go to https://resend.com/emails
   - Look for your email delivery status
   - Check if it was rejected by the recipient's email provider

2. **Verify Domain**:
   - In Resend dashboard, check **Domains**
   - Make sure your domain (or the default Resend domain) is verified
   - For development, you can use Resend's test domain

3. **Check Spam Folder**:
   - Sometimes emails end up in spam
   - Mark as "Not Spam" to train your email provider

4. **Check FROM_EMAIL**:
   ```env
   FROM_EMAIL="noreply@yourdomain.com"  # Use a verified domain
   FROM_EMAIL="onboarding@resend.dev"   # Or use Resend's test domain
   ```

### Issue: "API key is invalid"

- Make sure there are no extra spaces or quotes around the API key in `.env.local`
- Regenerate the API key in Resend dashboard
- Restart the development server after updating `.env.local`

### Issue: Rate limits

- Resend free tier: 100 emails/day
- Check your usage in the Resend dashboard
- Wait 24 hours or upgrade to a paid plan

## Environment Variables Reference

```env
# Required
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# Optional
FROM_EMAIL="noreply@startspooling.com"  # Default: noreply@startspooling.com
FROM_NAME="StartSpooling"                # Default: StartSpooling
```

## Testing Checklist

- [ ] API key is set in `.env.local`
- [ ] Server has been restarted
- [ ] API returns success
- [ ] Email appears in Resend dashboard
- [ ] Email arrives in inbox (not spam)
- [ ] Verification code is valid

## Next Steps

Once emails are working:

1. **Verify the verification code page** receives the email
2. **Test the code entry** to ensure it works
3. **Set up a custom domain** in Resend for production
4. **Configure SPF/DKIM records** for better deliverability

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Dashboard**: https://resend.com/dashboard
- **Contact Resend Support**: support@resend.com
