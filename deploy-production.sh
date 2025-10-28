#!/bin/bash

# StartSpooling Production Deployment Script
# Run this script to prepare for production deployment

echo "🚀 StartSpooling Production Deployment Setup"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "✅ Found project files"

# Generate NEXTAUTH_SECRET
echo "🔐 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"

echo ""
echo "📋 PRODUCTION SETUP CHECKLIST"
echo "=============================="
echo ""
echo "1. 🗄️  DATABASE SETUP (Supabase)"
echo "   - Go to https://supabase.com"
echo "   - Create new project"
echo "   - Copy connection string from Settings > Database"
echo "   - Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
echo ""
echo "2. 📧 EMAIL SETUP (Resend)"
echo "   - Go to https://resend.com"
echo "   - Create API key"
echo "   - Verify domain: startspooling.com"
echo "   - From email: noreply@startspooling.com"
echo ""
echo "3. 🌐 VERCEL DEPLOYMENT"
echo "   - Push code to GitHub"
echo "   - Connect to Vercel"
echo "   - Add environment variables (see below)"
echo ""
echo "4. 🔧 ENVIRONMENT VARIABLES TO ADD IN VERCEL:"
echo "   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
echo "   RESEND_API_KEY=re_xxxxxxxxxxxx"
echo "   FROM_EMAIL=noreply@startspooling.com"
echo "   NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "   NEXTAUTH_URL=https://startspooling.com"
echo "   VERIFICATION_CODE_EXPIRY_MINUTES=15"
echo ""
echo "5. 🚀 DEPLOYMENT COMMANDS:"
echo "   git add ."
echo "   git commit -m 'Prepare for production deployment'"
echo "   git push origin main"
echo ""
echo "6. ✅ POST-DEPLOYMENT TESTS:"
echo "   - Test email signup"
echo "   - Test verification flow"
echo "   - Test welcome page"
echo "   - Check database connection"
echo ""
echo "🎯 Ready to deploy! Follow the checklist above."
