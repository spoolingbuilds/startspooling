/**
 * @fileoverview Validation utilities for email and verification code handling.
 * This module provides functions for validating, sanitizing, and formatting
 * user inputs with comprehensive error handling and security measures.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of email validation
 */
export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Result of verification code validation
 */
export interface CodeValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Regular expression for email validation
 * Matches RFC 5322 compliant email addresses
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Maximum length for email addresses (RFC 5321)
 */
const MAX_EMAIL_LENGTH = 320;

/**
 * Validates an email address format and length.
 * Checks against RFC 5322 compliant regex and length limits.
 *
 * @param email - The email address to validate
 * @returns True if the email is valid, false otherwise
 *
 * @example
 * validateEmail("user@example.com"); // Returns true
 * validateEmail("invalid-email"); // Returns false
 * validateEmail(""); // Returns false
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Check length
  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  // Check format
  return EMAIL_REGEX.test(email);
}

/**
 * Validates an email address and returns detailed result.
 * Provides error messages for different validation failures.
 *
 * @param email - The email address to validate
 * @returns Object with validation result and optional error message
 *
 * @example
 * const result = validateEmailDetailed("user@example.com");
 * if (!result.isValid) {
 *   console.log(result.error); // "Invalid email format"
 * }
 */
export function validateEmailDetailed(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return { isValid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Sanitizes an email address by trimming whitespace and converting to lowercase.
 * Removes any leading/trailing whitespace and normalizes the format.
 *
 * @param email - The email address to sanitize
 * @returns The sanitized email address
 *
 * @example
 * sanitizeEmail("  USER@EXAMPLE.COM  "); // Returns "user@example.com"
 * sanitizeEmail("User@Example.Com"); // Returns "user@example.com"
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
}

/**
 * Masks an email address for display purposes.
 * Shows first 2 characters of local part + domain.
 *
 * @param email - The email address to mask
 * @returns The masked email address
 *
 * @example
 * maskEmail("user@example.com"); // Returns "us***@example.com"
 * maskEmail("a@test.com"); // Returns "a***@test.com"
 * maskEmail("ab@test.com"); // Returns "ab***@test.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const sanitized = sanitizeEmail(email);
  const [localPart, domain] = sanitized.split('@');

  if (!localPart || !domain) {
    return sanitized;
  }

  // Show first 2 characters of local part, mask the rest
  const visibleChars = Math.min(2, localPart.length);
  const maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(3);
  
  return `${maskedLocal}@${domain}`;
}

// ============================================================================
// VERIFICATION CODE VALIDATION
// ============================================================================

/**
 * Validates a verification code format.
 * Checks length and character set compatibility.
 *
 * @param code - The verification code to validate
 * @returns True if the code format is valid, false otherwise
 *
 * @example
 * validateVerificationCode("ABC123"); // Returns true
 * validateVerificationCode("abc123"); // Returns false (lowercase)
 * validateVerificationCode("ABC12"); // Returns false (too short)
 */
export function validateVerificationCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Check length (6 characters)
  if (code.length !== 6) {
    return false;
  }

  // Check if all characters are alphanumeric and uppercase
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code);
}

/**
 * Validates a verification code and returns detailed result.
 * Provides error messages for different validation failures.
 *
 * @param code - The verification code to validate
 * @returns Object with validation result and optional error message
 *
 * @example
 * const result = validateVerificationCodeDetailed("ABC123");
 * if (!result.isValid) {
 *   console.log(result.error); // "Invalid code format"
 * }
 */
export function validateVerificationCodeDetailed(code: string): CodeValidationResult {
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: 'Verification code is required' };
  }

  if (code.length !== 6) {
    return { isValid: false, error: 'Verification code must be 6 characters' };
  }

  const codeRegex = /^[A-Z0-9]{6}$/;
  if (!codeRegex.test(code)) {
    return { isValid: false, error: 'Invalid verification code format' };
  }

  return { isValid: true };
}

/**
 * Sanitizes a verification code input.
 * Removes whitespace, converts to uppercase, and trims.
 *
 * @param code - The verification code input to sanitize
 * @returns The sanitized verification code
 *
 * @example
 * sanitizeVerificationCode("  abc123  "); // Returns "ABC123"
 * sanitizeVerificationCode("a b c 1 2 3"); // Returns "ABC123"
 */
export function sanitizeVerificationCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return '';
  }

  return code.trim().replace(/\s+/g, '').toUpperCase();
}

// ============================================================================
// GENERAL INPUT VALIDATION
// ============================================================================

/**
 * Validates that a string is not empty and within length limits.
 *
 * @param input - The input string to validate
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length (default: 1000)
 * @returns True if the input is valid, false otherwise
 *
 * @example
 * validateString("hello", 1, 10); // Returns true
 * validateString("", 1, 10); // Returns false
 * validateString("very long string...", 1, 10); // Returns false
 */
export function validateString(
  input: string,
  minLength: number = 1,
  maxLength: number = 1000
): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const trimmed = input.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Sanitizes a string by trimming whitespace and removing excessive spaces.
 *
 * @param input - The input string to sanitize
 * @returns The sanitized string
 *
 * @example
 * sanitizeString("  hello   world  "); // Returns "hello world"
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validates a referral source string.
 * Checks format and length constraints.
 *
 * @param source - The referral source to validate
 * @returns True if the referral source is valid, false otherwise
 *
 * @example
 * validateReferralSource("twitter"); // Returns true
 * validateReferralSource(""); // Returns false
 */
export function validateReferralSource(source: string): boolean {
  if (!source) {
    return true; // Referral source is optional
  }

  if (typeof source !== 'string') {
    return false;
  }

  // Check length (max 50 characters)
  if (source.length > 50) {
    return false;
  }

  // Check format (alphanumeric, hyphens, underscores only)
  const sourceRegex = /^[a-zA-Z0-9_-]+$/;
  return sourceRegex.test(source);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a value is a valid non-empty string.
 *
 * @param value - The value to check
 * @returns True if the value is a valid non-empty string
 *
 * @example
 * isValidString("hello"); // Returns true
 * isValidString(""); // Returns false
 * isValidString(null); // Returns false
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if a value is a valid email string.
 *
 * @param value - The value to check
 * @returns True if the value is a valid email string
 *
 * @example
 * isValidEmailString("user@example.com"); // Returns true
 * isValidEmailString("invalid"); // Returns false
 */
export function isValidEmailString(value: unknown): value is string {
  return isValidString(value) && validateEmail(value);
}

/**
 * Checks if a value is a valid verification code string.
 *
 * @param value - The value to check
 * @returns True if the value is a valid verification code string
 *
 * @example
 * isValidCodeString("ABC123"); // Returns true
 * isValidCodeString("invalid"); // Returns false
 */
export function isValidCodeString(value: unknown): value is string {
  return isValidString(value) && validateVerificationCode(value);
}
