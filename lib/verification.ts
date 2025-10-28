import { customAlphabet } from 'nanoid';
import crypto from 'crypto';

/**
 * @fileoverview Secure verification code generation and validation utilities.
 * This module provides functions for generating, validating, and managing
 * time-limited verification codes with security features.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Length of verification codes in characters
 */
export const CODE_LENGTH = 6;

/**
 * Expiration time for verification codes in minutes
 */
export const CODE_EXPIRY_MINUTES = 15;

/**
 * Maximum number of verification attempts before lockout
 */
export const MAX_ATTEMPTS = 4;

/**
 * Lockout duration after max attempts in milliseconds (1 hour)
 */
export const LOCKOUT_DURATION_MS = 3600000;

/**
 * Valid characters for verification codes (uppercase only, excludes ambiguous characters)
 * Excludes: 0, O, I, l, 1 to avoid confusion
 */
export const VALID_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ============================================================================
// INTERNAL UTILITIES
// ============================================================================

/**
 * Custom alphabet generator for nanoid using only valid characters
 */
const generateCode = customAlphabet(VALID_CHARACTERS, CODE_LENGTH);

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generates a secure 6-character alphanumeric verification code.
 * Uses nanoid with a custom alphabet that excludes ambiguous characters
 * (0, O, I, l, 1) for better readability.
 *
 * @returns {string} A 6-character uppercase verification code
 *
 * @example
 * const code = generateVerificationCode();
 * // Returns something like: "K3X9P4"
 */
export function generateVerificationCode(): string {
  return generateCode();
}

// ============================================================================
// CODE EXPIRATION
// ============================================================================

/**
 * Checks if a verification code has expired based on its creation timestamp.
 * Codes expire after CODE_EXPIRY_MINUTES minutes (default: 15 minutes).
 *
 * @param {Date} createdAt - The timestamp when the code was created
 * @returns {boolean} True if the code has expired, false otherwise
 *
 * @example
 * const codeCreated = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
 * isCodeExpired(codeCreated); // Returns false
 *
 * const oldCode = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
 * isCodeExpired(oldCode); // Returns true
 */
export function isCodeExpired(createdAt: Date): boolean {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + CODE_EXPIRY_MINUTES * 60 * 1000);
  return now > expiryTime;
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Hashes a verification code using SHA-256 for secure storage.
 * This function should be used when storing codes in the database
 * to prevent potential data breaches from exposing plain-text codes.
 *
 * @param {string} code - The verification code to hash
 * @returns {string} The SHA-256 hashed version of the code
 *
 * @example
 * const code = "K3X9P4";
 * const hashedCode = hashCode(code);
 * // Returns: "a1b2c3d4..."
 */
export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Validates the format of a verification code.
 * Checks that the code is exactly CODE_LENGTH characters and contains
 * only valid characters from the VALID_CHARACTERS set.
 *
 * @param {string} code - The code to validate
 * @returns {boolean} True if the code format is valid, false otherwise
 *
 * @example
 * validateCodeFormat("K3X9P4"); // Returns true
 * validateCodeFormat("k3x9p4"); // Returns false (lowercase)
 * validateCodeFormat("K3X9P");  // Returns false (too short)
 * validateCodeFormat("K3X9P4X"); // Returns false (too long)
 * validateCodeFormat("K30P40"); // Returns false (contains 0)
 */
export function validateCodeFormat(code: string): boolean {
  if (!code || code.length !== CODE_LENGTH) {
    return false;
  }

  // Check if all characters are from the valid character set
  for (const char of code) {
    if (!VALID_CHARACTERS.includes(char)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitizes user input for verification codes.
 * Removes whitespace, converts to uppercase, and trims the input.
 * This ensures consistency when comparing user-entered codes.
 *
 * @param {string} input - The user input to sanitize
 * @returns {string} The sanitized code input
 *
 * @example
 * sanitizeCodeInput("  k3x9p4  "); // Returns "K3X9P4"
 * sanitizeCodeInput("k3 x 9 p4"); // Returns "K3X9P4"
 */
export function sanitizeCodeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.trim().replace(/\s+/g, '').toUpperCase();
}

// ============================================================================
// ADDITIONAL VALIDATION UTILITIES
// ============================================================================

/**
 * Validates a code with both format and expiration checks.
 * Combines format validation with expiration checking for convenience.
 *
 * @param {string} code - The code to validate
 * @param {Date} createdAt - The timestamp when the code was created
 * @returns {object} Object with isValid and reason properties
 *
 * @example
 * const result = validateCode(code, createdAt);
 * if (result.isValid) {
 *   // Code is valid
 * } else {
 *   console.log(result.reason); // "EXPIRED" or "INVALID_FORMAT"
 * }
 */
export function validateCode(code: string, createdAt: Date): { isValid: boolean; reason?: string } {
  // Sanitize the input first
  const sanitizedCode = sanitizeCodeInput(code);

  // Check format
  if (!validateCodeFormat(sanitizedCode)) {
    return { isValid: false, reason: 'INVALID_FORMAT' };
  }

  // Check expiration
  if (isCodeExpired(createdAt)) {
    return { isValid: false, reason: 'EXPIRED' };
  }

  return { isValid: true };
}

/**
 * Validates that a given timestamp is within the acceptable range.
 * Checks if the timestamp is not too far in the past or future.
 *
 * @param {Date} timestamp - The timestamp to validate
 * @param {number} maxAgeMinutes - Maximum age in minutes (default: CODE_EXPIRY_MINUTES)
 * @returns {boolean} True if the timestamp is valid
 */
export function isValidTimestamp(timestamp: Date, maxAgeMinutes: number = CODE_EXPIRY_MINUTES): boolean {
  const now = new Date();
  const maxAge = maxAgeMinutes * 60 * 1000;
  const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
  return timeDiff <= maxAge;
}

/**
 * Generates a hashed code that can be securely stored in the database.
 * This is a convenience function that combines code generation and hashing.
 *
 * @returns {object} Object containing both the plain code and hashed code
 *
 * @example
 * const { code, hashedCode } = generateSecureCode();
 * // Store hashedCode in database, send code to user
 */
export function generateSecureCode(): { code: string; hashedCode: string } {
  const code = generateVerificationCode();
  const hashedCode = hashCode(code);
  return { code, hashedCode };
}

/**
 * Gets the expiry date for a verification code.
 * Codes expire after CODE_EXPIRY_MINUTES minutes from now.
 *
 * @returns {Date} The expiry date for a new verification code
 *
 * @example
 * const expiry = getVerificationExpiry();
 * // Returns: Date object 15 minutes from now
 */
export function getVerificationExpiry(): Date {
  return new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
}
