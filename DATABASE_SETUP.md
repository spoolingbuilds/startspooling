# Waitlist Database Setup Guide

This guide will help you set up the complete PostgreSQL database for the waitlist application with email verification.

## Prerequisites

1. **PostgreSQL Installation**
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Node.js Dependencies**
   ```bash
   npm install
   ```

## Database Models

### WaitlistSignup Model
- **id**: Unique identifier (cuid)
- **email**: User's email address (unique)
- **verificationCode**: 6-character verification code
- **verificationAttempts**: Number of failed attempts (default: 0)
- **lockedUntil**: Account lock timestamp for rate limiting
- **isVerified**: Verification status (default: false)
- **verifiedAt**: Timestamp when verified
- **welcomeMessageId**: Which of 30 welcome messages they received
- **browserClient**: User agent string
- **ipAddress**: User's IP address
- **spoolTag**: Default "Spool_PL"
- **referralSource**: Optional referral source
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

### VerificationAttempt Model
- **id**: Unique identifier (cuid)
- **email**: Email that attempted verification
- **attemptedCode**: Code that was attempted
- **wasSuccessful**: Whether verification succeeded
- **ipAddress**: IP address of the attempt
- **timestamp**: When the attempt occurred

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/startspooling_waitlist"

# Email Service (Resend)
RESEND_API_KEY="your_resend_api_key_here"
FROM_EMAIL="noreply@startspooling.com"

# App Configuration
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Verification Settings
VERIFICATION_CODE_EXPIRY_MINUTES=15
MAX_VERIFICATION_ATTEMPTS=5
ACCOUNT_LOCK_DURATION_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_ATTEMPTS=3
```

### 2. Database Setup

**Option A: Using the setup script**
```bash
./setup-database.sh
```

**Option B: Manual setup**
```bash
# 1. Create PostgreSQL database
createdb startspooling_waitlist

# 2. Generate Prisma client
npx prisma generate

# 3. Run migrations
npx prisma migrate dev --name init_postgresql_setup

# 4. (Optional) Open Prisma Studio
npm run db:studio
```

### 3. Verify Setup

Test the database connection:

```bash
# Check if migrations were applied
npx prisma migrate status

# Open Prisma Studio to view data
npm run db:studio
```

## Database Utility Functions

The `/lib/db.ts` file provides comprehensive utility functions:

### Core Functions
- `createSignup()` - Create new waitlist signup
- `getSignupByEmail()` - Retrieve signup by email
- `incrementVerificationAttempts()` - Track failed attempts
- `lockAccount()` - Lock account for rate limiting
- `verifyAndUnlock()` - Verify and unlock account
- `checkIfLocked()` - Check if account is locked
- `updateVerificationCode()` - Generate new verification code
- `logVerificationAttempt()` - Log verification attempts
- `getVerifiedSignupCount()` - Get total verified count

### Additional Functions
- `getVerificationAttemptStats()` - Get attempt statistics
- `cleanupExpiredData()` - Clean up old data

## Usage Examples

```typescript
import { 
  createSignup, 
  verifyAndUnlock, 
  checkIfLocked,
  logVerificationAttempt 
} from '@/lib/db'

// Create a new signup
const result = await createSignup(
  'user@example.com',
  '123456',
  'Mozilla/5.0...',
  '192.168.1.1',
  'twitter'
)

// Check if account is locked
const lockStatus = await checkIfLocked('user@example.com')

// Verify and unlock account
if (lockStatus.success && !lockStatus.isLocked) {
  const verifyResult = await verifyAndUnlock('user@example.com')
}

// Log verification attempt
await logVerificationAttempt(
  'user@example.com',
  '123456',
  true,
  '192.168.1.1'
)
```

## Migration Commands

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Open Prisma Studio
npm run db:studio

# Reset database (development only)
npx prisma migrate reset
```

## Indexes and Performance

The schema includes optimized indexes:
- **Unique index** on `email` in WaitlistSignup
- **Non-unique index** on `email` in VerificationAttempt
- **Index** on `lockedUntil` for cleanup queries

## Security Features

- **Rate limiting** with account locking
- **Verification attempt tracking** for monitoring
- **IP address logging** for security
- **Automatic cleanup** of expired data
- **Comprehensive error handling**

## Monitoring and Maintenance

### Regular Cleanup
```typescript
// Clean up old verification attempts (keep 30 days)
await cleanupExpiredData(30)
```

### Statistics
```typescript
// Get verification attempt stats for last 24 hours
const stats = await getVerificationAttemptStats(undefined, 24)
console.log(`Total attempts: ${stats.totalAttempts}`)
console.log(`Success rate: ${stats.successfulAttempts / stats.totalAttempts * 100}%`)
```

## Troubleshooting

### Common Issues

1. **Connection Error**: Verify DATABASE_URL format
2. **Migration Fails**: Check PostgreSQL is running
3. **Permission Error**: Ensure database user has proper permissions

### Debug Commands
```bash
# Check database connection
npx prisma db pull

# View current schema
npx prisma db push --preview-feature

# Reset and recreate
npx prisma migrate reset
```

## Production Considerations

1. **Environment Variables**: Use secure environment variable management
2. **Connection Pooling**: Configure Prisma connection pooling
3. **Backup Strategy**: Implement regular database backups
4. **Monitoring**: Set up database monitoring and alerts
5. **Security**: Use SSL connections in production

## Support

For issues or questions:
1. Check Prisma documentation: https://www.prisma.io/docs/
2. Review PostgreSQL documentation: https://www.postgresql.org/docs/
3. Check the utility functions in `/lib/db.ts` for implementation details
