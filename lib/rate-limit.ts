/**
 * @fileoverview Rate limiting utilities with in-memory storage.
 * This module provides rate limiting functionality using Map-based storage
 * with automatic cleanup of expired entries for development environments.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  totalRequests: number;
}

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequest: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  entriesRemoved: number;
  entriesChecked: number;
  cleanupTimeMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default cleanup interval (5 minutes)
 */
const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Maximum number of entries to keep in memory
 */
const MAX_ENTRIES = 10000;

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

/**
 * In-memory rate limiter with automatic cleanup
 */
class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isCleaningUp = false;

  constructor() {
    this.startCleanup();
  }

  /**
   * Starts the automatic cleanup process
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, DEFAULT_CLEANUP_INTERVAL_MS);
  }

  /**
   * Stops the automatic cleanup process
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Cleans up expired entries from the store
   *
   * @returns Cleanup statistics
   */
  private cleanupExpiredEntries(): CleanupStats {
    if (this.isCleaningUp) {
      return { entriesRemoved: 0, entriesChecked: 0, cleanupTimeMs: 0 };
    }

    this.isCleaningUp = true;
    const startTime = Date.now();
    let entriesRemoved = 0;
    let entriesChecked = 0;

    try {
      const now = Date.now();
      
      const entries = Array.from(this.store.entries())
      for (const [key, entry] of entries) {
        entriesChecked++;
        
        // Remove entries that are older than their window
        if (now - entry.windowStart > DEFAULT_CLEANUP_INTERVAL_MS * 2) {
          this.store.delete(key);
          entriesRemoved++;
        }
      }

      // If we have too many entries, remove the oldest ones
      if (this.store.size > MAX_ENTRIES) {
        const entries = Array.from(this.store.entries())
          .sort(([, a], [, b]) => a.lastRequest - b.lastRequest);
        
        const toRemove = this.store.size - MAX_ENTRIES;
        for (let i = 0; i < toRemove; i++) {
          this.store.delete(entries[i][0]);
          entriesRemoved++;
        }
      }
    } finally {
      this.isCleaningUp = false;
    }

    return {
      entriesRemoved,
      entriesChecked,
      cleanupTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Checks if a request is allowed under the rate limit
   *
   * @param identifier - Unique identifier for the rate limit (e.g., IP, user ID)
   * @param config - Rate limit configuration
   * @returns Rate limit result
   */
  checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = `${identifier}:${config.windowMs}`;
    
    let entry = this.store.get(key);
    
    if (!entry) {
      // First request in this window
      entry = {
        count: 1,
        windowStart: now,
        lastRequest: now,
      };
      this.store.set(key, entry);
      
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetAt: new Date(now + config.windowMs),
        totalRequests: 1,
      };
    }

    // Check if we're still in the same window
    if (now - entry.windowStart < config.windowMs) {
      // Still in the same window
      entry.count++;
      entry.lastRequest = now;
      
      const allowed = entry.count <= config.limit;
      
      return {
        allowed,
        remaining: Math.max(0, config.limit - entry.count),
        resetAt: new Date(entry.windowStart + config.windowMs),
        totalRequests: entry.count,
      };
    } else {
      // New window, reset the counter
      entry.count = 1;
      entry.windowStart = now;
      entry.lastRequest = now;
      
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetAt: new Date(now + config.windowMs),
        totalRequests: 1,
      };
    }
  }

  /**
   * Gets current rate limit status for an identifier
   *
   * @param identifier - Unique identifier
   * @param config - Rate limit configuration
   * @returns Current rate limit status
   */
  getRateLimitStatus(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = `${identifier}:${config.windowMs}`;
    const entry = this.store.get(key);
    
    if (!entry || now - entry.windowStart >= config.windowMs) {
      // No entry or expired window
      return {
        allowed: true,
        remaining: config.limit,
        resetAt: new Date(now + config.windowMs),
        totalRequests: 0,
      };
    }

    const allowed = entry.count <= config.limit;
    
    return {
      allowed,
      remaining: Math.max(0, config.limit - entry.count),
      resetAt: new Date(entry.windowStart + config.windowMs),
      totalRequests: entry.count,
    };
  }

  /**
   * Resets the rate limit for an identifier
   *
   * @param identifier - Unique identifier
   * @param config - Rate limit configuration
   */
  resetRateLimit(identifier: string, config: RateLimitConfig): void {
    const key = `${identifier}:${config.windowMs}`;
    this.store.delete(key);
  }

  /**
   * Gets statistics about the rate limiter
   *
   * @returns Statistics object
   */
  getStats(): {
    totalEntries: number;
    memoryUsage: number;
    cleanupInterval: number;
  } {
    return {
      totalEntries: this.store.size,
      memoryUsage: this.store.size * 100, // Rough estimate in bytes
      cleanupInterval: DEFAULT_CLEANUP_INTERVAL_MS,
    };
  }

  /**
   * Manually triggers cleanup of expired entries
   *
   * @returns Cleanup statistics
   */
  cleanup(): CleanupStats {
    return this.cleanupExpiredEntries();
  }

  /**
   * Destroys the rate limiter and cleans up resources
   */
  destroy(): void {
    this.stopCleanup();
    this.store.clear();
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

/**
 * Global rate limiter instance
 */
const rateLimiter = new InMemoryRateLimiter();

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Checks if a request is allowed under the rate limit
 *
 * @param identifier - Unique identifier for the rate limit (e.g., IP, user ID)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result with allowed status and remaining requests
 *
 * @example
 * const result = checkRateLimit("192.168.1.1", 10, 60000); // 10 requests per minute
 * if (!result.allowed) {
 *   console.log(`Rate limit exceeded. Try again at ${result.resetAt}`);
 * }
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const config: RateLimitConfig = {
    limit,
    windowMs,
  };

  return rateLimiter.checkRateLimit(identifier, config);
}

/**
 * Checks rate limit with detailed configuration
 *
 * @param identifier - Unique identifier for the rate limit
 * @param config - Rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * const result = checkRateLimitWithConfig("user123", {
 *   limit: 5,
 *   windowMs: 300000, // 5 minutes
 *   skipSuccessfulRequests: true
 * });
 */
export function checkRateLimitWithConfig(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return rateLimiter.checkRateLimit(identifier, config);
}

/**
 * Gets current rate limit status without incrementing the counter
 *
 * @param identifier - Unique identifier
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Current rate limit status
 *
 * @example
 * const status = getRateLimitStatus("192.168.1.1", 10, 60000);
 * console.log(`Remaining requests: ${status.remaining}`);
 */
export function getRateLimitStatus(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const config: RateLimitConfig = {
    limit,
    windowMs,
  };

  return rateLimiter.getRateLimitStatus(identifier, config);
}

/**
 * Resets the rate limit for an identifier
 *
 * @param identifier - Unique identifier
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 *
 * @example
 * resetRateLimit("192.168.1.1", 10, 60000);
 */
export function resetRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): void {
  const config: RateLimitConfig = {
    limit,
    windowMs,
  };

  rateLimiter.resetRateLimit(identifier, config);
}

/**
 * Gets statistics about the rate limiter
 *
 * @returns Statistics object
 *
 * @example
 * const stats = getRateLimiterStats();
 * console.log(`Total entries: ${stats.totalEntries}`);
 */
export function getRateLimiterStats(): {
  totalEntries: number;
  memoryUsage: number;
  cleanupInterval: number;
} {
  return rateLimiter.getStats();
}

/**
 * Manually triggers cleanup of expired entries
 *
 * @returns Cleanup statistics
 *
 * @example
 * const cleanup = cleanupExpiredEntries();
 * console.log(`Removed ${cleanup.entriesRemoved} expired entries`);
 */
export function cleanupExpiredEntries(): CleanupStats {
  return rateLimiter.cleanup();
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  /**
   * Strict rate limit: 5 requests per minute
   */
  STRICT: { limit: 5, windowMs: 60 * 1000 },
  
  /**
   * Moderate rate limit: 10 requests per minute
   */
  MODERATE: { limit: 10, windowMs: 60 * 1000 },
  
  /**
   * Lenient rate limit: 20 requests per minute
   */
  LENIENT: { limit: 20, windowMs: 60 * 1000 },
  
  /**
   * Hourly rate limit: 100 requests per hour
   */
  HOURLY: { limit: 100, windowMs: 60 * 60 * 1000 },
  
  /**
   * Daily rate limit: 1000 requests per day
   */
  DAILY: { limit: 1000, windowMs: 24 * 60 * 60 * 1000 },
} as const;

/**
 * Checks rate limit using predefined configurations
 *
 * @param identifier - Unique identifier
 * @param preset - Predefined rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * const result = checkRateLimitPreset("192.168.1.1", RATE_LIMITS.STRICT);
 */
export function checkRateLimitPreset(
  identifier: string,
  preset: { limit: number; windowMs: number }
): RateLimitResult {
  return checkRateLimit(identifier, preset.limit, preset.windowMs);
}

/**
 * Creates a rate limit middleware function
 *
 * @param config - Rate limit configuration
 * @returns Middleware function
 *
 * @example
 * const middleware = createRateLimitMiddleware(RATE_LIMITS.MODERATE);
 * const result = middleware("192.168.1.1");
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (identifier: string) => checkRateLimitWithConfig(identifier, config);
}
