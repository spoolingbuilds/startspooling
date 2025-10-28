# Pre-Deployment Checklist

## Environment Setup
- [ ] Database created (Supabase/Neon/Railway)
- [ ] DATABASE_URL set in Vercel
- [ ] Resend account created
- [ ] RESEND_API_KEY set in Vercel
- [ ] Domain configured (startspooling.com)
- [ ] SSL certificate active

## Database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify tables created
- [ ] Seed database if needed
- [ ] Set up automated backups
- [ ] Test database connection from deployed app

## Email
- [ ] Verify Resend domain
- [ ] Send test email
- [ ] Check spam folder delivery
- [ ] Set up email forwarding for support@
- [ ] Configure SPF, DKIM, DMARC records

## Testing
- [ ] Test full signup flow on staging
- [ ] Test email delivery (check spam)
- [ ] Test verification with correct code
- [ ] Test verification with wrong code (all 4 attempts)
- [ ] Test account lockout (verify 1 hour wait)
- [ ] Test code expiry (wait 15 minutes)
- [ ] Test resend functionality
- [ ] Test rate limiting (try exceeding limits)
- [ ] Test on mobile devices (iOS and Android)
- [ ] Test in different browsers (Chrome, Safari, Firefox)
- [ ] Test with slow internet connection

## Performance
- [ ] Run Lighthouse audit (aim for 90+ performance)
- [ ] Test Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Verify animations run at 60fps
- [ ] Test on low-end mobile devices
- [ ] Check bundle size (< 200KB initial load)

## Security
- [ ] Security headers configured (check with securityheaders.com)
- [ ] Rate limiting active and tested
- [ ] No API keys exposed in client code
- [ ] HTTPS enforced
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Review all error messages (no sensitive data leaked)
- [ ] Test input sanitization
- [ ] Verify IP ban system works
- [ ] Check failed attempt tracking

## Monitoring
- [ ] Error logging configured (Sentry or similar)
- [ ] Analytics tracking tested
- [ ] Set up uptime monitoring (UptimeRobot/Pingdom)
- [ ] Configure alerts for:
  * API errors
  * Database connection failures
  * Email sending failures
  * Unusual traffic patterns

## Content
- [ ] All copy reviewed and approved
- [ ] 50+ welcome messages tested
- [ ] Email template tested across email clients
- [ ] 404 page tested
- [ ] Error pages tested

## DNS & Domain
- [ ] Domain pointed to Vercel
- [ ] www redirect configured (www → non-www or vice versa)
- [ ] DNS propagation complete (check with whatsmydns.net)

## Post-Deployment
- [ ] Test complete flow on production
- [ ] Send test signup with real email
- [ ] Verify welcome message appears
- [ ] Test all social share links work
- [ ] Monitor error logs for first 24 hours
- [ ] Check email deliverability rates

## Instagram Launch Preparation
- [ ] Instagram posts scheduled
- [ ] Bio updated with link
- [ ] Stories prepared
- [ ] First 9 grid posts uploaded
- [ ] Auto-reply DM message set up

## Rollback Plan
- [ ] Document current deployment version
- [ ] Test rollback procedure
- [ ] Have previous version ready to redeploy
- [ ] Database backup created before migration

Deploy only when ALL boxes are checked.

