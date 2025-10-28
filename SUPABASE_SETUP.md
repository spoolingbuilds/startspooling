# Supabase + Vercel Setup Guide

## Step 1: Create Supabase Project

1. **Go to**: https://supabase.com/dashboard
2. **Click**: "New Project"
3. **Fill in**:
   - Project name: `startspooling-waitlist`
   - Database password: (generate a strong password)
   - Region: Choose closest to your users
4. **Click**: "Create new project"
5. **Wait**: 2-3 minutes for setup

## Step 2: Get Connection Details

1. **Go to**: Settings → Database
2. **Copy**: Connection string (URI)
   - Format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
3. **Copy**: Project URL and API keys from Settings → API

## Step 3: Set Up Database Schema

Run these commands in your Supabase SQL editor:

```sql
-- Create the waitlist_signups table
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  verification_code TEXT NOT NULL,
  verification_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  welcome_message_id INTEGER,
  welcome_message_text TEXT,
  calculated_number INTEGER,
  browser_client TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  spool_tag TEXT DEFAULT 'Spool_PL',
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the verification_attempts table
CREATE TABLE IF NOT EXISTS verification_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  attempted_code TEXT NOT NULL,
  was_successful BOOLEAN NOT NULL,
  ip_address TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_locked_until ON waitlist_signups(locked_until);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email_verified ON waitlist_signups(email, is_verified);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_ip_created ON waitlist_signups(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_email ON verification_attempts(email);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on waitlist_signups" ON waitlist_signups FOR ALL USING (true);
CREATE POLICY "Allow all operations on verification_attempts" ON verification_attempts FOR ALL USING (true);
```

## Step 4: Update Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DATABASE_URL = postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL = https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon-key]
SUPABASE_URL = https://[project-ref].supabase.co
SUPABASE_ANON_KEY = [anon-key]
```

## Step 5: Test Connection

1. **Deploy to Vercel**
2. **Test**: `https://your-domain.com/api/test-db`
3. **Should return**: `{"success": true, "tests": {"envVar": true, "prisma": true, "supabase": true}}`

## Step 6: Configure Supabase Settings

1. **Go to**: Settings → Database
2. **Enable**: Connection pooling (recommended for serverless)
3. **Set**: Connection limit to 100
4. **Enable**: SSL connections

## Troubleshooting

### Connection Issues
- **Check**: Database password is correct
- **Verify**: Project is not paused
- **Ensure**: SSL is enabled
- **Test**: Connection string format

### Performance Issues
- **Enable**: Connection pooling
- **Set**: Appropriate connection limits
- **Monitor**: Database usage in Supabase dashboard

### Security
- **Enable**: Row Level Security (RLS)
- **Create**: Appropriate policies
- **Use**: Service role key for server operations
- **Restrict**: Database access by IP if needed
