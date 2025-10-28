/**
 * @fileoverview Time utility functions for formatting, expiry checking, and time calculations.
 * This module provides comprehensive time-related utilities for the verification flow
 * including time formatting, expiry validation, and lock time calculations.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Time format options
 */
export interface TimeFormatOptions {
  showSeconds?: boolean;
  showHours?: boolean;
  padZero?: boolean;
}

/**
 * Time remaining result
 */
export interface TimeRemainingResult {
  formatted: string;
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

/**
 * Expiry check result
 */
export interface ExpiryCheckResult {
  isExpired: boolean;
  remainingMs: number;
  remainingFormatted: string;
  expiredAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Milliseconds in different time units
 */
export const TIME_UNITS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Default expiry times in minutes
 */
export const DEFAULT_EXPIRY_TIMES = {
  VERIFICATION_CODE: 15,
  SESSION: 60,
  RESET_TOKEN: 30,
  LOCKOUT: 60,
} as const;

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Formats time remaining in milliseconds to "MM:SS" or "HH:MM:SS" format
 *
 * @param ms - Time in milliseconds
 * @param options - Formatting options
 * @returns Formatted time string
 *
 * @example
 * formatTimeRemaining(90000); // Returns "1:30"
 * formatTimeRemaining(3661000); // Returns "1:01:01"
 * formatTimeRemaining(90000, { showSeconds: false }); // Returns "1"
 */
export function formatTimeRemaining(
  ms: number,
  options: TimeFormatOptions = {}
): string {
  const {
    showSeconds = true,
    showHours = true,
    padZero = true,
  } = options;

  if (ms <= 0) {
    return showHours ? '0:00:00' : '0:00';
  }

  const totalSeconds = Math.floor(ms / TIME_UNITS.SECOND);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (showHours || hours > 0) {
    const pad = padZero ? (n: number) => n.toString().padStart(2, '0') : (n: number) => n.toString();
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    const pad = padZero ? (n: number) => n.toString().padStart(2, '0') : (n: number) => n.toString();
    return showSeconds ? `${minutes}:${pad(seconds)}` : minutes.toString();
  }
}

/**
 * Formats time remaining with detailed breakdown
 *
 * @param ms - Time in milliseconds
 * @returns Detailed time remaining result
 *
 * @example
 * const result = formatTimeRemainingDetailed(90000);
 * console.log(result.formatted); // "1:30"
 * console.log(result.hours); // 0
 * console.log(result.minutes); // 1
 * console.log(result.seconds); // 30
 */
export function formatTimeRemainingDetailed(ms: number): TimeRemainingResult {
  if (ms <= 0) {
    return {
      formatted: '0:00',
      totalMs: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(ms / TIME_UNITS.SECOND);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return {
    formatted,
    totalMs: ms,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

/**
 * Formats a duration in a human-readable format
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable duration string
 *
 * @example
 * formatDuration(90000); // Returns "1 minute 30 seconds"
 * formatDuration(3661000); // Returns "1 hour 1 minute 1 second"
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) {
    return '0 seconds';
  }

  const days = Math.floor(ms / TIME_UNITS.DAY);
  const hours = Math.floor((ms % TIME_UNITS.DAY) / TIME_UNITS.HOUR);
  const minutes = Math.floor((ms % TIME_UNITS.HOUR) / TIME_UNITS.MINUTE);
  const seconds = Math.floor((ms % TIME_UNITS.MINUTE) / TIME_UNITS.SECOND);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

// ============================================================================
// EXPIRY CHECKING
// ============================================================================

/**
 * Checks if a date has expired based on expiry minutes
 *
 * @param date - The date to check
 * @param expiryMinutes - Expiry time in minutes
 * @returns True if the date has expired
 *
 * @example
 * const createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
 * isExpired(createdAt, 15); // Returns true
 * isExpired(createdAt, 30); // Returns false
 */
export function isExpired(date: Date, expiryMinutes: number): boolean {
  const now = new Date();
  const expiryTime = new Date(date.getTime() + expiryMinutes * TIME_UNITS.MINUTE);
  return now > expiryTime;
}

/**
 * Checks expiry with detailed information
 *
 * @param date - The date to check
 * @param expiryMinutes - Expiry time in minutes
 * @returns Detailed expiry check result
 *
 * @example
 * const result = isExpiredDetailed(createdAt, 15);
 * if (result.isExpired) {
 *   console.log('Expired');
 * } else {
 *   console.log(`Expires in ${result.remainingFormatted}`);
 * }
 */
export function isExpiredDetailed(
  date: Date,
  expiryMinutes: number
): ExpiryCheckResult {
  const now = new Date();
  const expiryTime = new Date(date.getTime() + expiryMinutes * TIME_UNITS.MINUTE);
  const remainingMs = expiryTime.getTime() - now.getTime();
  const isExpired = remainingMs <= 0;

  return {
    isExpired,
    remainingMs: Math.max(0, remainingMs),
    remainingFormatted: formatTimeRemaining(Math.max(0, remainingMs)),
    expiredAt: expiryTime,
  };
}

/**
 * Gets the time until expiry in milliseconds
 *
 * @param createdAt - The creation date
 * @param expiryMinutes - Expiry time in minutes
 * @returns Time until expiry in milliseconds (0 if expired)
 *
 * @example
 * const timeLeft = getTimeUntilExpiry(createdAt, 15);
 * console.log(`${timeLeft}ms until expiry`);
 */
export function getTimeUntilExpiry(createdAt: Date, expiryMinutes: number): number {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + expiryMinutes * TIME_UNITS.MINUTE);
  const remainingMs = expiryTime.getTime() - now.getTime();
  return Math.max(0, remainingMs);
}

// ============================================================================
// LOCK TIME UTILITIES
// ============================================================================

/**
 * Gets the remaining lock time in milliseconds
 *
 * @param lockedUntil - The lock expiry date
 * @returns Remaining lock time in milliseconds (0 if not locked)
 *
 * @example
 * const lockTime = getLockTimeRemaining(lockedUntil);
 * if (lockTime > 0) {
 *   console.log(`Locked for ${formatTimeRemaining(lockTime)}`);
 * }
 */
export function getLockTimeRemaining(lockedUntil: Date): number {
  const now = new Date();
  const remainingMs = lockedUntil.getTime() - now.getTime();
  return Math.max(0, remainingMs);
}

/**
 * Checks if an account is currently locked
 *
 * @param lockedUntil - The lock expiry date
 * @returns True if the account is locked
 *
 * @example
 * if (isLocked(lockedUntil)) {
 *   console.log('Account is locked');
 * }
 */
export function isLocked(lockedUntil: Date): boolean {
  return getLockTimeRemaining(lockedUntil) > 0;
}

/**
 * Gets lock status with detailed information
 *
 * @param lockedUntil - The lock expiry date
 * @returns Detailed lock status
 *
 * @example
 * const status = getLockStatus(lockedUntil);
 * if (status.isLocked) {
 *   console.log(`Locked for ${status.remainingFormatted}`);
 * }
 */
export function getLockStatus(lockedUntil: Date): {
  isLocked: boolean;
  remainingMs: number;
  remainingFormatted: string;
  unlockedAt: Date;
} {
  const remainingMs = getLockTimeRemaining(lockedUntil);
  const isLocked = remainingMs > 0;

  return {
    isLocked,
    remainingMs,
    remainingFormatted: formatTimeRemaining(remainingMs),
    unlockedAt: lockedUntil,
  };
}

// ============================================================================
// TIME CALCULATIONS
// ============================================================================

/**
 * Adds minutes to a date
 *
 * @param date - The base date
 * @param minutes - Minutes to add
 * @returns New date with minutes added
 *
 * @example
 * const future = addMinutes(new Date(), 15);
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * TIME_UNITS.MINUTE);
}

/**
 * Subtracts minutes from a date
 *
 * @param date - The base date
 * @param minutes - Minutes to subtract
 * @returns New date with minutes subtracted
 *
 * @example
 * const past = subtractMinutes(new Date(), 15);
 */
export function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * TIME_UNITS.MINUTE);
}

/**
 * Gets the difference between two dates in milliseconds
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Difference in milliseconds (positive if date1 is later)
 *
 * @example
 * const diff = getTimeDifference(new Date(), createdAt);
 * console.log(`${diff}ms difference`);
 */
export function getTimeDifference(date1: Date, date2: Date): number {
  return date1.getTime() - date2.getTime();
}

/**
 * Gets the difference between two dates in minutes
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Difference in minutes (positive if date1 is later)
 *
 * @example
 * const diffMinutes = getMinutesDifference(new Date(), createdAt);
 * console.log(`${diffMinutes} minutes difference`);
 */
export function getMinutesDifference(date1: Date, date2: Date): number {
  return Math.floor(getTimeDifference(date1, date2) / TIME_UNITS.MINUTE);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a date from now plus the specified minutes
 *
 * @param minutes - Minutes to add to now
 * @returns Future date
 *
 * @example
 * const expiry = createExpiryDate(15); // 15 minutes from now
 */
export function createExpiryDate(minutes: number): Date {
  return addMinutes(new Date(), minutes);
}

/**
 * Creates a date from now plus the specified milliseconds
 *
 * @param ms - Milliseconds to add to now
 * @returns Future date
 *
 * @example
 * const expiry = createExpiryDateMs(900000); // 15 minutes from now
 */
export function createExpiryDateMs(ms: number): Date {
  return new Date(Date.now() + ms);
}

/**
 * Gets the current timestamp in milliseconds
 *
 * @returns Current timestamp
 *
 * @example
 * const now = getCurrentTimestamp();
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Gets the current timestamp as a Date object
 *
 * @returns Current date
 *
 * @example
 * const now = getCurrentDate();
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Converts milliseconds to minutes
 *
 * @param ms - Milliseconds
 * @returns Minutes
 *
 * @example
 * const minutes = msToMinutes(90000); // Returns 1.5
 */
export function msToMinutes(ms: number): number {
  return ms / TIME_UNITS.MINUTE;
}

/**
 * Converts minutes to milliseconds
 *
 * @param minutes - Minutes
 * @returns Milliseconds
 *
 * @example
 * const ms = minutesToMs(1.5); // Returns 90000
 */
export function minutesToMs(minutes: number): number {
  return minutes * TIME_UNITS.MINUTE;
}

/**
 * Rounds a date to the nearest minute
 *
 * @param date - The date to round
 * @returns Rounded date
 *
 * @example
 * const rounded = roundToMinute(new Date());
 */
export function roundToMinute(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  return rounded;
}

/**
 * Checks if two dates are within the same minute
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are in the same minute
 *
 * @example
 * const sameMinute = isSameMinute(date1, date2);
 */
export function isSameMinute(date1: Date, date2: Date): boolean {
  return roundToMinute(date1).getTime() === roundToMinute(date2).getTime();
}
