/**
 * Application Constants
 * 
 * Centralized constants for verification flow, rate limiting, and other
 * application-wide settings. These values should match your environment
 * variables for consistency.
 */

export const VERIFICATION = {
  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 15,
  MAX_ATTEMPTS: 4,
  LOCKOUT_DURATION_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  VALID_CHARACTERS: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // Excludes confusing characters
} as const;

export const RATE_LIMITS = {
  SIGNUP_PER_IP_HOUR: 3,
  VERIFY_PER_IP_HOUR: 10,
  RESEND_PER_EMAIL_HOUR: 3,
  EMAIL_SEND_PER_HOUR: 5,
} as const;

export const EMAIL_TEMPLATES = {
  VERIFICATION: "verification-code",
  WELCOME: "welcome",
  RESEND_CODE: "resend-code",
} as const;

export const ERROR_CODES = {
  INVALID_CODE: "INVALID_CODE",
  EXPIRED_CODE: "EXPIRED_CODE",
  MAX_ATTEMPTS_EXCEEDED: "MAX_ATTEMPTS_EXCEEDED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  EMAIL_NOT_FOUND: "EMAIL_NOT_FOUND",
  EMAIL_ALREADY_VERIFIED: "EMAIL_ALREADY_VERIFIED",
} as const;

export type VerificationConfig = typeof VERIFICATION;
export type RateLimitsConfig = typeof RATE_LIMITS;
export type EmailTemplatesConfig = typeof EMAIL_TEMPLATES;
export type ErrorCodesConfig = typeof ERROR_CODES;
