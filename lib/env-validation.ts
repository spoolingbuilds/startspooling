// Environment variable validation and security configuration
// /lib/env-validation.ts

import { validateEnvironment } from './security'

// Validate environment variables on startup
export function validateAppEnvironment(): void {
  const validation = validateEnvironment()
  
  if (!validation.isValid) {
    console.error('❌ Environment validation failed:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production')
    } else {
      console.warn('⚠️  Environment validation failed in development - continuing with warnings')
    }
  } else {
    console.log('✅ Environment validation passed')
  }
}

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    SIGNUP_PER_IP_PER_HOUR: 3,
    VERIFICATION_PER_IP_PER_HOUR: 10,
    RESEND_PER_EMAIL_PER_HOUR: 3,
    FAILED_ATTEMPTS_BEFORE_BAN: 20,
    BAN_DURATION_HOURS: 1
  },
  
  // Verification codes
  VERIFICATION: {
    CODE_LENGTH: 6,
    EXPIRY_MINUTES: 15,
    MAX_ATTEMPTS: 4,
    LOCKOUT_DURATION_HOURS: 1
  },
  
  // Email security
  EMAIL: {
    MAX_EMAIL_LENGTH: 254,
    SPF_RECORD_REQUIRED: true,
    DKIM_SIGNING_REQUIRED: true,
    DMARC_POLICY_REQUIRED: true
  },
  
  // Session security
  SESSION: {
    COOKIE_NAME: 'spool_session',
    MAX_AGE_HOURS: 1,
    HTTP_ONLY: true,
    SECURE_IN_PRODUCTION: true,
    SAME_SITE: 'lax' as const
  },
  
  // Security headers
  HEADERS: {
    CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.resend.com; frame-ancestors 'none';",
    HSTS_MAX_AGE: 63072000, // 2 years
    PERMISSIONS_POLICY: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  }
}

// Database security configuration
export const DATABASE_SECURITY = {
  // Use parameterized queries (Prisma handles this)
  USE_PARAMETERIZED_QUERIES: true,
  
  // Connection limits
  MAX_CONNECTIONS: 10,
  CONNECTION_TIMEOUT_MS: 30000,
  
  // Query limits
  MAX_QUERY_EXECUTION_TIME_MS: 5000,
  
  // Backup frequency
  BACKUP_FREQUENCY_HOURS: 24,
  
  // Encryption at rest (if applicable)
  ENCRYPT_AT_REST: false // Set to true if using encrypted storage
}

// Monitoring and alerting configuration
export const MONITORING_CONFIG = {
  // Alert thresholds
  ALERT_THRESHOLDS: {
    HIGH_FAILED_ATTEMPTS_PER_HOUR: 50,
    HIGH_SIGNUP_RATE_PER_HOUR: 100,
    HIGH_ERROR_RATE_PERCENTAGE: 10,
    SUSPICIOUS_IP_ACTIVITY: 5
  },
  
  // Log retention
  LOG_RETENTION_DAYS: 30,
  
  // Monitoring endpoints
  HEALTH_CHECK_ENDPOINT: '/api/health',
  METRICS_ENDPOINT: '/api/metrics',
  
  // Alert channels (configure in production)
  ALERT_CHANNELS: {
    EMAIL: process.env.ALERT_EMAIL || '',
    SLACK: process.env.SLACK_WEBHOOK || '',
    DISCORD: process.env.DISCORD_WEBHOOK || ''
  }
}

// Export validation function for use in app startup
export default validateAppEnvironment
