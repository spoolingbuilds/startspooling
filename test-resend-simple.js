require('dotenv').config({ path: '.env.local' })
const { Resend } = require('resend')

// Test Resend configuration
async function testResendConfig() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@startspooling.com'
  
  console.log('🔍 Testing Resend Configuration')
  console.log('===============================')
  console.log('FROM_EMAIL:', FROM_EMAIL)
  console.log('API Key configured:', !!RESEND_API_KEY)
  console.log('')
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured')
    return
  }
  
  const resend = new Resend(RESEND_API_KEY)
  
  try {
    // Test sending to team@startspooling.com (should work)
    console.log('📧 Testing email to team@startspooling.com...')
    const result1 = await resend.emails.send({
      from: `StartSpooling <${FROM_EMAIL}>`,
      to: 'team@startspooling.com',
      subject: 'Test Email - Domain Verification',
      text: 'This is a test email to verify domain configuration.',
    })
    console.log('✅ Success:', result1)
    
    // Test sending to a different email (should work if domain is verified)
    console.log('')
    console.log('📧 Testing email to test@example.com...')
    const result2 = await resend.emails.send({
      from: `StartSpooling <${FROM_EMAIL}>`,
      to: 'test@example.com',
      subject: 'Test Email - Domain Verification',
      text: 'This is a test email to verify domain configuration.',
    })
    console.log('✅ Success:', result2)
    
  } catch (error) {
    console.error('❌ Error:', error)
    
    if (error && typeof error === 'object') {
      const err = error
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode
      })
      
      if (err.message && err.message.includes('You can only send testing emails')) {
        console.log('')
        console.log('🔧 SOLUTION:')
        console.log('1. Go to https://resend.com/domains')
        console.log('2. Verify your domain:', FROM_EMAIL.split('@')[1])
        console.log('3. Wait for verification to complete')
        console.log('4. Make sure FROM_EMAIL uses the verified domain')
      }
    }
  }
}

testResendConfig()
