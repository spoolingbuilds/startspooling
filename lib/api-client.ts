/**
 * @fileoverview API client utilities for waitlist and verification operations.
 * This module provides typed functions for API calls with comprehensive
 * error handling, retry logic, and response validation.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Waitlist submission response
 */
export interface WaitlistResponse {
  success: boolean;
  message: string;
  position?: number;
  total?: number;
}

/**
 * Verification response
 */
export interface VerificationResponse {
  success: boolean;
  message: string;
  verified?: boolean;
  attemptsRemaining?: number;
  lockedUntil?: string;
}

/**
 * Resend code response
 */
export interface ResendCodeResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
  attemptsRemaining?: number;
}

/**
 * API error types
 */
export type ApiErrorType = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Detailed API error
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  retryable: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * API endpoints
 */
const API_ENDPOINTS = {
  WAITLIST: '/api/waitlist',
  VERIFY_CODE: '/api/verify-code',
  RESEND_CODE: '/api/resend-code',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a delay promise for retry logic
 *
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay
 *
 * @param attempt - Current attempt number (0-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Determines if an error is retryable
 *
 * @param error - The error to check
 * @returns True if the error is retryable
 */
function isRetryableError(error: ApiError): boolean {
  return Boolean(error.retryable && (
    error.type === 'NETWORK_ERROR' ||
    error.type === 'SERVER_ERROR' ||
    (error.status && error.status >= 500)
  ));
}

/**
 * Creates an API error from various error sources
 *
 * @param error - The error source
 * @param status - HTTP status code
 * @returns Structured API error
 */
function createApiError(error: unknown, status?: number): ApiError {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection.',
        retryable: true,
      };
    }

    // Generic errors
    return {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      status,
      retryable: status ? status >= 500 : false,
    };
  }

  // Unknown error type
  return {
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    status,
    retryable: false,
  };
}

/**
 * Makes an API request with retry logic
 *
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @param retryConfig - Retry configuration
 * @returns Promise resolving to the response
 */
async function makeApiRequest<T>(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<ApiResponse<T>> {
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          type: response.status === 429 ? 'RATE_LIMIT_ERROR' : 
                response.status >= 400 && response.status < 500 ? 'VALIDATION_ERROR' :
                'SERVER_ERROR',
          message: data.error || data.message || `HTTP ${response.status}`,
          status: response.status,
          retryable: response.status >= 500,
        };

        if (attempt === retryConfig.maxRetries || !isRetryableError(error)) {
          return {
            success: false,
            error: error.message,
          };
        }

        lastError = error;
      } else {
        return {
          success: true,
          data,
        };
      }
    } catch (error) {
      const apiError = createApiError(error);

      if (attempt === retryConfig.maxRetries || !isRetryableError(apiError)) {
        return {
          success: false,
          error: apiError.message,
        };
      }

      lastError = apiError;
    }

    // Wait before retry
    if (attempt < retryConfig.maxRetries) {
      const delayMs = calculateBackoffDelay(attempt, retryConfig);
      await delay(delayMs);
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded',
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Submits an email to the waitlist
 *
 * @param email - The email address to add to the waitlist
 * @param referralSource - Optional referral source
 * @returns Promise resolving to waitlist response
 *
 * @example
 * const result = await submitWaitlist("user@example.com", "twitter");
 * if (result.success) {
 *   console.log(`Position: ${result.data?.position}`);
 * }
 */
export async function submitWaitlist(
  email: string,
  referralSource?: string
): Promise<ApiResponse<WaitlistResponse>> {
  const body = {
    email: email.trim().toLowerCase(),
    ...(referralSource && { referralSource: referralSource.trim() }),
  };

  return makeApiRequest<WaitlistResponse>(API_ENDPOINTS.WAITLIST, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Verifies a verification code for an email
 *
 * @param email - The email address
 * @param code - The verification code
 * @returns Promise resolving to verification response
 *
 * @example
 * const result = await verifyCode("user@example.com", "ABC123");
 * if (result.success) {
 *   console.log("Email verified successfully");
 * }
 */
export async function verifyCode(
  email: string,
  code: string
): Promise<ApiResponse<VerificationResponse>> {
  const body = {
    email: email.trim().toLowerCase(),
    code: code.trim().toUpperCase().replace(/\s+/g, ''),
  };

  return makeApiRequest<VerificationResponse>(API_ENDPOINTS.VERIFY_CODE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Resends a verification code to an email
 *
 * @param email - The email address
 * @returns Promise resolving to resend response
 *
 * @example
 * const result = await resendCode("user@example.com");
 * if (result.success) {
 *   console.log("Code sent successfully");
 * }
 */
export async function resendCode(
  email: string
): Promise<ApiResponse<ResendCodeResponse>> {
  const body = {
    email: email.trim().toLowerCase(),
  };

  return makeApiRequest<ResendCodeResponse>(API_ENDPOINTS.RESEND_CODE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Submits multiple emails to the waitlist in parallel
 *
 * @param emails - Array of email addresses
 * @param referralSource - Optional referral source for all emails
 * @returns Promise resolving to array of responses
 *
 * @example
 * const results = await submitWaitlistBatch([
 *   "user1@example.com",
 *   "user2@example.com"
 * ], "twitter");
 */
export async function submitWaitlistBatch(
  emails: string[],
  referralSource?: string
): Promise<ApiResponse<WaitlistResponse>[]> {
  const promises = emails.map(email => 
    submitWaitlist(email, referralSource)
  );

  return Promise.all(promises);
}

/**
 * Verifies multiple codes in parallel
 *
 * @param verifications - Array of email/code pairs
 * @returns Promise resolving to array of responses
 *
 * @example
 * const results = await verifyCodeBatch([
 *   { email: "user1@example.com", code: "ABC123" },
 *   { email: "user2@example.com", code: "DEF456" }
 * ]);
 */
export async function verifyCodeBatch(
  verifications: Array<{ email: string; code: string }>
): Promise<ApiResponse<VerificationResponse>[]> {
  const promises = verifications.map(({ email, code }) => 
    verifyCode(email, code)
  );

  return Promise.all(promises);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if an API response indicates success
 *
 * @param response - The API response to check
 * @returns True if the response indicates success
 *
 * @example
 * if (isSuccessResponse(result)) {
 *   // Handle success
 * }
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Extracts error message from API response
 *
 * @param response - The API response
 * @returns Error message or default message
 *
 * @example
 * const errorMsg = getErrorMessage(result);
 * console.log(errorMsg);
 */
export function getErrorMessage(response: ApiResponse): string {
  return response.error || response.message || 'An unexpected error occurred';
}

/**
 * Creates a custom retry configuration
 *
 * @param config - Partial retry configuration
 * @returns Complete retry configuration
 *
 * @example
 * const customConfig = createRetryConfig({
 *   maxRetries: 5,
 *   baseDelayMs: 500
 * });
 */
export function createRetryConfig(config: Partial<RetryConfig>): RetryConfig {
  return {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };
}
