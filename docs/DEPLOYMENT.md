# Deployment Guide

This guide covers deploying the StartSpooling waitlist application to production on Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [Database Setup](#database-setup)
- [Email Service Setup](#email-service-setup)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [x] A GitHub account
- [x] A Vercel account (free tier works)
- [x] A PostgreSQL database
- [x] A Resend account for email service
- [x] Domain name (optional, but recommended)

## Vercel Deployment

### Step 1: Push Code to GitHub

```bash
# Initialize git repository (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote repository
git remote add origin https://github.com/your-username/startspooling-waitlist.git

# Push to GitHub
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### Step 3: Configure Build Settings

Vercel will auto-configure, but verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Environment Variables

See [Environment Variables](#environment-variables) section below for required variables.

## Database Setup

You need a PostgreSQL database for production. Here are the recommended options:

### Option 1: Supabase (Recommended)

**Free Tier Includes:**
- 500 MB database storage
- 2 GB bandwidth
- Unlimited API requests

**Setup Steps:**

1. Go to [Supabase](https://supabase.com) and create an account
2. Create a new project
3. Copy your connection string from **Settings > Database**
4. Format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

**Pros:**
- Free tier is generous
- Easy setup
- Great documentation
- Built-in dashboard

### Option 2: Neon

**Free Tier Includes:**
- 3 GB storage
- Unlimited branches
- Serverless Postgres

**Setup Steps:**

1. Go to [Neon](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string

**Pros:**
- Auto-scaling
- Serverless architecture
- Branching support
- Generous free tier

### Option 3: Railway

**Free Tier (Hobby):**
- $5 credit/month
- Pay-as-you-go

**Setup Steps:**

1. Go to [Railway](https://railway.app) and sign up
2. Create new project
3. Add a PostgreSQL service
4. Get connection string from variables

**Pros:**
- Easy deployment
- Auto-deploys from GitHub
- Simple interface

### Running Migrations

After setting up your database, run migrations:

```bash
# Locally
npx prisma generate
npx prisma migrate deploy

# Or push schema directly
npx prisma db push
```

Or use Vercel's build command which automatically runs `prisma generate`.

## Email Service Setup

### Resend Account

1. Go to [Resend](https://resend.com) and create an account
2. Verify your domain (recommended) or use the default domain
3. Navigate to **API Keys** and create a new key
4. Copy the API key

**Email Configuration:**

- From email should be something like: `noreply@yourdomain.com`
- Use your verified domain for better deliverability

### Alternative Email Services

- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free
- **AWS SES**: Very cheap, pay-as-you-go

## Environment Variables

Add these in **Vercel Dashboard > Project Settings > Environment Variables**:

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Email Service
RESEND_API_KEY="re_xxxxxxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"

# NextAuth (for sessions)
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="https://yourdomain.com"

# Optional: Verification code expiry (in minutes)
VERIFICATION_CODE_EXPIRY_MINUTES="15"
```

### Generating NEXTAUTH_SECRET

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64')"
```

### Environment-Specific Variables

For production vs development:

- Add variables under **Production**, **Preview**, and **Development** environments
- Production URL: `https://yourdomain.com`
- Preview URL: `https://your-app.vercel.app`
- Development URL: `http://localhost:3000`

## Post-Deployment Checklist

After deployment, verify everything works:

### [ ] Database Connection

- [ ] Check Vercel build logs for successful Prisma generation
- [ ] Verify database connection in Vercel logs
- [ ] Test database queries

### [ ] Email Delivery

- [ ] Sign up with your email
- [ ] Receive verification code
- [ ] Check spam folder if email doesn't arrive
- [ ] Test resend functionality

### [ ] Verification Flow

- [ ] Enter correct code
- [ ] Verify account
- [ ] Check welcome page
- [ ] Test lockout after 4 failed attempts

### [ ] Rate Limiting

- [ ] Test signup rate limit (3/hour per IP)
- [ ] Test verification rate limit (10/hour per IP)
- [ ] Test resend rate limit (3/hour per email)

### [ ] Security

- [ ] HTTPS is enabled
- [ ] Security headers are present
- [ ] Environment variables not exposed
- [ ] Database credentials secure

### [ ] Performance

- [ ] Core Web Vitals pass
- [ ] Page loads quickly
- [ ] Images are optimized
- [ ] No console errors

## Monitoring

### Vercel Analytics

1. Go to **Project Settings > Analytics**
2. Enable Web Vitals
3. Monitor Core Web Vitals

### Database Monitoring

**Supabase:**
- Check dashboard for slow queries
- Monitor connection pool usage
- Set up alerts for errors

**Neon:**
- Use Neon Console to monitor
- Check query performance
- Set up alerts

### Logging

Check logs in Vercel:
- Go to **Deployments > View Function Logs**
- Check for errors or warnings
- Monitor API response times

### Error Tracking

Consider integrating:

- **Sentry**: Error tracking and performance
- **LogRocket**: Session replay
- **Datadog**: Full observability

## Domain Configuration

### Add Custom Domain

1. Go to **Project Settings > Domains**
2. Add your domain: `waitlist.yourdomain.com`
3. Follow DNS configuration instructions

### SSL Certificate

- Vercel automatically provisions SSL certificates
- Uses Let's Encrypt
- Renews automatically

### DNS Records

Add these DNS records:

```
Type  Name  Value
CNAME waitlist  cname.vercel-dns.com
```

## Troubleshooting

### Build Failures

**Error: Prisma Client not generated**

Solution:
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### Email Not Sending

**Check:**
1. Resend API key is valid
2. Domain is verified in Resend
3. FROM_EMAIL matches verified domain
4. Check spam folder

### Database Connection Issues

**Error: Can't reach database server**

Solutions:
- Verify DATABASE_URL is correct
- Check firewall rules
- Whitelist Vercel IPs
- Use connection pooling (recommended)

### Rate Limiting Issues

**Issue: Users getting rate limited**

Solutions:
- Adjust rate limits in middleware
- Use Redis for distributed rate limiting
- Increase limits if needed

### Slow Performance

**Optimizations:**
1. Enable caching where appropriate
2. Use Vercel's edge network
3. Optimize images
4. Reduce bundle size
5. Use CDN for static assets

## Scaling

### Database Scaling

As your waitlist grows:

- **Supabase**: Upgrade to Pro ($25/month)
- **Neon**: Scales automatically
- **Railway**: Add resources as needed

### Email Scaling

- **Resend**: 3,000 emails/month free, then $20/month
- Consider upgrade for higher volume
- Monitor email sending costs

### Cost Optimization

**Free Tier Limits:**
- Vercel: 100GB bandwidth, unlimited requests
- Database: Check provider limits
- Email: 3,000/month with Resend free tier

**Recommended:**
- Monitor usage in Vercel dashboard
- Set up billing alerts
- Optimize queries to reduce database usage

## Security Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database credentials secure
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] No sensitive data in logs
- [ ] CORS configured if needed
- [ ] Domain email verification works
- [ ] Account lockout works correctly

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review database logs
3. Verify environment variables
4. Test endpoints manually
5. Check Next.js documentation
6. Contact support@startspooling.com

---

**Ready to go live?** 🚀

After completing the checklist above, your waitlist should be fully functional and ready for users!

