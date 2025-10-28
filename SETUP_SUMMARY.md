# Complete Database Setup Summary

## ✅ What's Been Created

### 1. Prisma Schema (`prisma/schema.prisma`)
- **WaitlistSignup** model with all required fields
- **VerificationAttempt** model for audit logging
- PostgreSQL provider configuration
- Optimized indexes for performance

### 2. Database Utility Functions (`lib/db.ts`)
- `createSignup()` - Create new waitlist signup
- `getSignupByEmail()` - Retrieve signup by email
- `incrementVerificationAttempts()` - Track failed attempts
- `lockAccount()` - Lock account for rate limiting
- `verifyAndUnlock()` - Verify and unlock account
- `checkIfLocked()` - Check if account is locked
- `updateVerificationCode()` - Generate new verification code
- `logVerificationAttempt()` - Log verification attempts
- `getVerifiedSignupCount()` - Get total verified count
- `getVerificationAttemptStats()` - Get attempt statistics
- `cleanupExpiredData()` - Clean up old data

### 3. Setup Files
- `setup-database.sh` - Automated database setup script
- `test-db.ts` - Comprehensive test script
- `DATABASE_SETUP.md` - Detailed setup guide
- Updated `package.json` with PostgreSQL dependencies
- Updated `env.example` with all required environment variables

## 🚀 Quick Start Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Create `.env` file with:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/startspooling_waitlist"
RESEND_API_KEY="your_resend_api_key_here"
FROM_EMAIL="noreply@startspooling.com"
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"
VERIFICATION_CODE_EXPIRY_MINUTES=15
MAX_VERIFICATION_ATTEMPTS=5
ACCOUNT_LOCK_DURATION_MINUTES=30
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_ATTEMPTS=3
```

### 3. Set Up Database
```bash
# Option A: Automated setup
./setup-database.sh

# Option B: Manual setup
createdb startspooling_waitlist
npm run db:generate
npm run db:migrate
```

### 4. Test Database Functions
```bash
npm run db:test
```

### 5. Open Prisma Studio (Optional)
```bash
npm run db:studio
```

## 📋 Available Scripts

```bash
# Database Management
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Create and apply migrations
npm run db:push        # Push schema changes (dev only)
npm run db:studio      # Open Prisma Studio
npm run db:test        # Test database functions
npm run db:reset       # Reset database (dev only)
npm run db:status      # Check migration status

# Development
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
```

## 🔧 Migration Commands

### Initial Setup
```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init_postgresql_setup

# Apply migrations to production
npx prisma migrate deploy
```

### Development Workflow
```bash
# After schema changes
npx prisma migrate dev --name describe_your_changes

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

## 🗄️ Database Schema Details

### WaitlistSignup Table
```sql
CREATE TABLE "waitlist_signups" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "verificationCode" TEXT NOT NULL,
  "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "welcomeMessageId" INTEGER,
  "browserClient" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "spoolTag" TEXT NOT NULL DEFAULT 'Spool_PL',
  "referralSource" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "waitlist_signups_email_key" ON "waitlist_signups"("email");
CREATE INDEX "waitlist_signups_lockedUntil_idx" ON "waitlist_signups"("lockedUntil");
```

### VerificationAttempt Table
```sql
CREATE TABLE "verification_attempts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "attemptedCode" TEXT NOT NULL,
  "wasSuccessful" BOOLEAN NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "verification_attempts_email_idx" ON "verification_attempts"("email");
```

## 🔒 Security Features

- **Rate Limiting**: Account locking after failed attempts
- **Audit Logging**: All verification attempts are logged
- **IP Tracking**: IP addresses stored for security monitoring
- **Data Cleanup**: Automatic cleanup of expired data
- **Error Handling**: Comprehensive error handling in all functions

## 📊 Monitoring & Analytics

### Built-in Statistics
```typescript
// Get verification attempt statistics
const stats = await getVerificationAttemptStats('user@example.com', 24)
console.log(`Success rate: ${stats.successfulAttempts / stats.totalAttempts * 100}%`)

// Get total verified signups
const count = await getVerifiedSignupCount()
console.log(`Total verified: ${count}`)
```

### Cleanup Operations
```typescript
// Clean up old verification attempts (keep 30 days)
await cleanupExpiredData(30)
```

## 🎯 Next Steps

1. **Set up PostgreSQL database** using the provided commands
2. **Configure environment variables** in your `.env` file
3. **Run migrations** to create the database schema
4. **Test the functions** using the provided test script
5. **Integrate with your application** using the utility functions

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Setup Guide**: See `DATABASE_SETUP.md` for detailed instructions
- **Test Script**: Run `npm run db:test` to verify everything works

## 🆘 Troubleshooting

### Common Issues
1. **DATABASE_URL not set**: Ensure `.env` file exists with correct PostgreSQL URL
2. **PostgreSQL not running**: Start PostgreSQL service
3. **Permission errors**: Ensure database user has proper permissions
4. **Migration conflicts**: Use `npx prisma migrate reset` (development only)

### Debug Commands
```bash
# Check database connection
npx prisma db pull

# View current schema
npx prisma db push --preview-feature

# Reset everything (development only)
npx prisma migrate reset
```

---

**🎉 Your complete PostgreSQL database setup for waitlist signups with email verification is ready!**
