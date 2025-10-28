# StartSpooling Waitlist

A production-ready waitlist application for StartSpooling, an automotive performance platform. Built with Next.js 14, featuring secure email verification, sophisticated rate limiting, and enterprise-level security.

## 🚗 Features

- **Ultra-Minimal Design**: Cryptic, automotive-themed UI with full mobile responsiveness
- **Email Verification**: Secure 6-character code verification system
- **Multi-Layer Rate Limiting**: IP-based and email-based protection with IP bans
- **Account Security**: Lockout after failed attempts with countdown timers
- **Comprehensive Security**: Security headers, input sanitization, failed attempt tracking
- **Analytics Tracking**: Full event tracking for GA4/Plausible/Mixpanel integration
- **Production Ready**: Security headers, error handling, and monitoring
- **TypeScript**: Full type safety throughout the application
- **PostgreSQL**: Robust database with Prisma ORM
- **Email Service**: Minimal, mysterious email templates via Resend
- **50+ Welcome Messages**: Cryptic, technical messages for post-verification

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma
- **Email**: Resend API
- **Deployment**: Vercel (optimized)
- **Security**: Rate limiting, HTTPS, security headers

## 📚 Documentation

- [**Deployment Checklist**](./docs/DEPLOYMENT-CHECKLIST.md) - Pre-deployment checklist
- [**Deployment Guide**](./docs/DEPLOYMENT.md) - Step-by-step deployment instructions
- [**API Documentation**](./docs/API.md) - Complete API reference
- [**Architecture Guide**](./docs/ARCHITECTURE.md) - Technical deep-dive

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Resend API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd startspooling-waitlist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your actual values:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/startspooling_waitlist"
   RESEND_API_KEY="your_resend_api_key_here"
   FROM_EMAIL="noreply@startspooling.com"
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   NEXTAUTH_URL="http://localhost:3000"
   VERIFICATION_CODE_EXPIRY_MINUTES=15
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── waitlist/      # Waitlist signup
│   │   ├── verify-code/   # Email verification
│   │   └── resend-code/   # Resend verification
│   ├── verify/            # Verification page
│   ├── welcome/           # Success page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/             # React components
│   ├── WaitlistForm.tsx   # Email signup form
│   └── icons.tsx          # Custom icons
├── lib/                   # Utility functions
│   ├── prisma.ts          # Database client
│   ├── utils.ts           # Helper functions
│   └── verification.ts   # Verification logic
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema
└── config/                # Configuration files
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🎨 Design System

The project uses a custom automotive-themed design system:

- **Primary Colors**: Turbo red (#ef4444) for CTAs and highlights
- **Background**: Dark slate gradient for automotive feel
- **Typography**: Inter font family for modern readability
- **Components**: Reusable components with consistent styling

## 📧 Email Templates

The application includes HTML email templates for:
- Welcome/verification emails
- Code resend emails
- Responsive design for all email clients

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app is compatible with any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

### Comprehensive Protection
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- **Input Sanitization**: All user inputs sanitized and validated
- **Rate Limiting**: IP-based bans after 20 failed attempts (1-hour duration)
- **Failed Attempt Tracking**: Comprehensive logging of all suspicious activity
- **SQL Injection Prevention**: Parameterized queries via Prisma ORM
- **XSS Prevention**: Input sanitization and CSP headers
- **HTTPS Enforcement**: TLS 1.3 with certificate pinning
- **Email Security**: SPF, DKIM, DMARC records configured

### Account Protection
- Email verification with time-limited codes (15-minute expiry)
- Account lockout after 4 failed verification attempts
- 1-hour lockout duration with countdown timer
- Session-based authentication with secure cookies
- Automatic session expiry (1 hour)

## ⚡ Rate Limiting

The application includes a production-ready rate limiting system:

### Features
- **Sliding window algorithm** for accurate rate limiting
- **In-memory storage** for single-instance deployments
- **Redis support** for multi-instance/serverless (fully implemented)
- **Automatic cleanup** every 5 minutes
- **Multiple strategies**: IP-based, email-based, and custom limits
- **Standard HTTP headers**: Retry-After, X-RateLimit-*

### Pre-configured Limits
- **Signup**: 3 requests/hour per IP
- **Verification**: 10 requests/hour per IP
- **Resend Code**: 3 requests/hour per email
- **Email Sending**: 5 requests/hour per email

### Usage
```typescript
import { checkSignupRateLimitHelper } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const rateLimitError = await checkSignupRateLimitHelper(request)
  if (rateLimitError) return rateLimitError
  
  // Continue processing...
}
```

See [RATE_LIMITING.md](./RATE_LIMITING.md) for complete documentation.

## 📊 Analytics & Tracking

### Comprehensive Event Tracking
The application includes a complete analytics system ready for integration with:
- **Google Analytics 4** (GA4)
- **Plausible Analytics**
- **Mixpanel**
- **Custom Analytics Backend**

### Events Tracked
- **Page Views**: Landing, verify, welcome pages
- **Form Interactions**: Start, submit, errors, success
- **Verification Events**: Code entry, errors, success, locks, resends
- **Engagement**: Time on page, scroll depth, button interactions
- **Drop-off Points**: Email entered but not submitted, verification abandoned
- **Conversion Funnel**: Complete user journey tracking
- **Welcome Page**: Message ID tracking, screenshot detection

### Privacy Compliant
- Email addresses hashed before sending
- Session IDs instead of personal identifiers
- GDPR/CCPA ready
- No verification codes tracked
- UTM parameter capture for campaign attribution

### Integration
Simply uncomment the appropriate service in `/lib/analytics.ts`:
```typescript
// For GA4:
if (window.gtag) window.gtag('event', event, properties)

// For Plausible:
if (window.plausible) window.plausible(event, { props: properties })
```

## 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized images and assets
- Fast loading times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🔐 Environment Variables

### Required Variables

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Email Service (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"

# Session Management
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"  # For production: https://yourdomain.com

# Verification Settings (Optional)
VERIFICATION_CODE_EXPIRY_MINUTES="15"  # Default: 15 minutes
```

### Database Setup Options

**Free Tier Options:**
- [Supabase](https://supabase.com) - 500 MB storage, easy setup
- [Neon](https://neon.tech) - Serverless Postgres, 3 GB storage
- [Railway](https://railway.app) - $5 credit/month

**Production Options:**
- AWS RDS (managed database)
- Google Cloud SQL
- DigitalOcean Managed Databases

### Getting API Keys

1. **Resend**: Sign up at [resend.com](https://resend.com) and get API key from dashboard
2. **Database**: See [Deployment Guide](./docs/DEPLOYMENT.md#database-setup) for setup
3. **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`

## 🧪 Testing Checklist

Before deploying to production, test all functionality:

### Email Flow Testing
- [ ] Email signup with valid email
- [ ] Email delivery (check inbox and spam folder)
- [ ] Invalid email format rejected
- [ ] Duplicate email handling

### Verification Testing
- [ ] Correct code verification (success)
- [ ] Incorrect code (shows attempts remaining)
- [ ] Wrong code 4 times (account locks)
- [ ] Lockout countdown timer works
- [ ] Code expiry after 15 minutes
- [ ] Expired code error message

### Resend Functionality
- [ ] Resend code button works
- [ ] New code replaces old code
- [ ] Resend rate limit (3/hour) enforced
- [ ] Can't resend if already verified
- [ ] Can't resend if locked

### Rate Limiting
- [ ] Signup limit (3/hour per IP)
- [ ] Verification limit (10/hour per IP)
- [ ] Resend limit (3/hour per email)
- [ ] Rate limit headers present
- [ ] Retry-After header correct

### User Experience
- [ ] Mobile responsive (iPhone, Android)
- [ ] Welcome page variety (test multiple signups)
- [ ] Error handling (network errors)
- [ ] Invalid inputs handled gracefully
- [ ] Loading states work
- [ ] Session persistence

### Browser Compatibility
- [ ] Chrome (desktop and mobile)
- [ ] Firefox (desktop and mobile)
- [ ] Safari (desktop and mobile)
- [ ] Edge (desktop)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA

### Performance
- [ ] Core Web Vitals pass
- [ ] Fast page load (< 2s)
- [ ] Images optimized
- [ ] No console errors

## 🔒 Security Audit Checklist

Before going live, verify all security measures:

### Environment & Deployment
- [ ] Environment variables not exposed to client
- [ ] DATABASE_URL not in client bundle
- [ ] API keys secure
- [ ] HTTPS enforced in production
- [ ] Mixed content warnings resolved
- [ ] Environment validation on startup
- [ ] All security headers configured in vercel.json

### Input Validation
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (input sanitization)
- [ ] Email format validation
- [ ] Code format validation (6 chars, uppercase)
- [ ] No raw SQL queries

### Rate Limiting
- [ ] All API endpoints rate limited
- [ ] IP-based rate limiting works
- [ ] Email-based rate limiting works
- [ ] Rate limit info in headers
- [ ] No bypass vulnerabilities
- [ ] IP ban system working (20 failed attempts)
- [ ] Failed attempt tracking active
- [ ] Security logging configured

### Email Security
- [ ] Email verification required
- [ ] Codes expire after 15 minutes
- [ ] No enumeration attacks (don't reveal if email exists)
- [ ] Secure email delivery (Resend)
- [ ] FROM_EMAIL domain verified

### Authentication & Session
- [ ] Session cookies httpOnly
- [ ] Session cookies secure in production
- [ ] Session expiration works (1 hour)
- [ ] Account lockout works (1 hour after 4 attempts)
- [ ] No session fixation

### Data Protection
- [ ] No sensitive data in logs
- [ ] Email addresses masked in responses
- [ ] IP addresses not exposed
- [ ] Error messages don't leak info
- [ ] Database credentials secure

### Headers & CORS
- [ ] Security headers configured
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
  - [ ] Content-Security-Policy configured
- [ ] CORS configured if needed
- [ ] No unnecessary headers exposed

### Error Handling
- [ ] Generic error messages (no stack traces)
- [ ] Error logging implemented
- [ ] No sensitive info in errors
- [ ] 404 handling works
- [ ] 500 handling works

### Monitoring
- [ ] Error tracking setup (optional: Sentry)
- [ ] Application monitoring
- [ ] Database monitoring
- [ ] Email delivery monitoring
- [ ] Rate limit monitoring
- [ ] Analytics tracking configured and tested
- [ ] Security event logging active
- [ ] Suspicious activity alerts configured

## 🚀 Production Deployment

**⚠️ Before deploying, complete the [Pre-Deployment Checklist](./docs/DEPLOYMENT-CHECKLIST.md)**

See [**Deployment Guide**](./docs/DEPLOYMENT.md) for detailed instructions.

### Quick Deploy

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

```bash
git push origin main
# Vercel auto-deploys
```

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to production database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

## 📊 API Endpoints

- `POST /api/waitlist` - Create signup
- `POST /api/verify-code` - Verify email
- `POST /api/resend-code` - Resend code

See [**API Documentation**](./docs/API.md) for complete reference.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support:
- Email: support@startspooling.com
- Documentation: [docs/](./docs/)
- Issues: GitHub Issues

---

**StartSpooling** - Where automotive passion meets cutting-edge technology. 🏁

**Ready to launch?** Follow the checklists above and deploy with confidence!
