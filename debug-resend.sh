#!/bin/bash

# Resend Domain Verification Debug Script
# This script helps debug Resend domain verification issues

echo "🔍 Resend Domain Verification Debug"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "lib/email.ts" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📧 Current Email Configuration:"
echo "==============================="

# Extract FROM_EMAIL from the code
FROM_EMAIL=$(grep "FROM_EMAIL.*=" lib/email.ts | head -1 | sed 's/.*=.*||.*//' | sed 's/.*"//' | sed 's/".*//')
echo "FROM_EMAIL: $FROM_EMAIL"

# Check environment variables
if [ -f ".env.local" ]; then
    echo ""
    echo "🔧 Environment Variables (.env.local):"
    echo "======================================"
    grep -E "^(FROM_EMAIL|RESEND_API_KEY)" .env.local | sed 's/=.*/=***HIDDEN***/'
else
    echo ""
    echo "⚠️  No .env.local file found"
fi

echo ""
echo "🔍 Resend Domain Verification Checklist:"
echo "======================================="
echo ""
echo "1. ✅ Go to https://resend.com/domains"
echo "2. ✅ Verify your domain (e.g., startspooling.com)"
echo "3. ✅ Add DNS records as instructed"
echo "4. ✅ Wait for verification (can take up to 24 hours)"
echo "5. ✅ Check that domain shows 'Verified' status"
echo ""
echo "🔧 Common Issues & Solutions:"
echo "============================="
echo ""
echo "❌ Issue: 'You can only send testing emails to your own email address'"
echo "✅ Solution: Make sure FROM_EMAIL uses your verified domain"
echo "   Example: FROM_EMAIL=noreply@startspooling.com"
echo ""
echo "❌ Issue: Domain shows 'Pending' verification"
echo "✅ Solution: Check DNS records, wait for propagation"
echo ""
echo "❌ Issue: FROM_EMAIL doesn't match verified domain"
echo "✅ Solution: Update FROM_EMAIL to use verified domain"
echo ""
echo "🔧 To Fix:"
echo "1. Update FROM_EMAIL in .env.local:"
echo "   FROM_EMAIL=noreply@startspooling.com"
echo ""
echo "2. Or update the default in lib/email.ts:"
echo "   const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@startspooling.com'"
echo ""
echo "3. Restart your development server:"
echo "   npm run dev"
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Verify your domain at resend.com/domains"
echo "2. Update FROM_EMAIL to use verified domain"
echo "3. Test with a different email address"
echo "4. Check server logs for detailed error messages"
