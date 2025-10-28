import { prisma } from './prisma'

// Type definitions for better type safety
export interface CreateSignupData {
  email: string
  verificationCode: string
  browserClient: string
  ipAddress: string
  referralSource?: string
}

export interface SignupResult {
  success: boolean
  data?: any
  error?: string
}

export interface VerificationResult {
  success: boolean
  isLocked?: boolean
  lockUntil?: Date
  data?: any
  error?: string
}

/**
 * Creates a new waitlist signup with email verification
 * @param email - User's email address
 * @param verificationCode - 6-character verification code
 * @param browserClient - User agent string
 * @param ipAddress - User's IP address
 * @param referralSource - Optional referral source
 * @returns Promise<SignupResult>
 */
export async function createSignup(
  email: string,
  verificationCode: string,
  browserClient: string,
  ipAddress: string,
  referralSource?: string
): Promise<SignupResult> {
  try {
    // Check if email already exists
    const existingSignup = await prisma.waitlistSignup.findUnique({
      where: { email }
    })

    if (existingSignup) {
      return {
        success: false,
        error: 'Email already exists in waitlist'
      }
    }

    // Create new signup
    const signup = await prisma.waitlistSignup.create({
      data: {
        email,
        verificationCode,
        browserClient,
        ipAddress,
        referralSource: referralSource || null
      }
    })

    return {
      success: true,
      data: signup
    }
  } catch (error) {
    console.error('Error creating signup:', error)
    return {
      success: false,
      error: 'Failed to create signup'
    }
  }
}

/**
 * Retrieves a signup by email address
 * @param email - Email address to search for
 * @returns Promise<SignupResult>
 */
export async function getSignupByEmail(email: string): Promise<SignupResult> {
  try {
    const signup = await prisma.waitlistSignup.findUnique({
      where: { email }
    })

    if (!signup) {
      return {
        success: false,
        error: 'Signup not found'
      }
    }

    return {
      success: true,
      data: signup
    }
  } catch (error) {
    console.error('Error getting signup by email:', error)
    return {
      success: false,
      error: 'Failed to retrieve signup'
    }
  }
}

/**
 * Increments verification attempts counter for a signup
 * @param email - Email address of the signup
 * @returns Promise<SignupResult>
 */
export async function incrementVerificationAttempts(email: string): Promise<SignupResult> {
  try {
    const signup = await prisma.waitlistSignup.update({
      where: { email },
      data: {
        verificationAttempts: {
          increment: 1
        }
      }
    })

    return {
      success: true,
      data: signup
    }
  } catch (error) {
    console.error('Error incrementing verification attempts:', error)
    return {
      success: false,
      error: 'Failed to increment verification attempts'
    }
  }
}

/**
 * Locks an account until a specified time (for rate limiting)
 * @param email - Email address of the signup
 * @param lockUntilTime - DateTime when the lock should expire
 * @returns Promise<SignupResult>
 */
export async function lockAccount(email: string, lockUntilTime: Date): Promise<SignupResult> {
  try {
    const signup = await prisma.waitlistSignup.update({
      where: { email },
      data: {
        lockedUntil: lockUntilTime
      }
    })

    return {
      success: true,
      data: signup
    }
  } catch (error) {
    console.error('Error locking account:', error)
    return {
      success: false,
      error: 'Failed to lock account'
    }
  }
}

/**
 * Verifies a signup and unlocks the account
 * @param email - Email address of the signup
 * @returns Promise<VerificationResult>
 */
export async function verifyAndUnlock(email: string): Promise<VerificationResult> {
  try {
    const signup = await prisma.waitlistSignup.update({
      where: { email },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        lockedUntil: null,
        verificationAttempts: 0 // Reset attempts on successful verification
      }
    })

    return {
      success: true,
      data: signup
    }
  } catch (error) {
    console.error('Error verifying and unlocking account:', error)
    return {
      success: false,
      error: 'Failed to verify and unlock account'
    }
  }
}

/**
 * Checks if an account is currently locked
 * @param email - Email address of the signup
 * @returns Promise<VerificationResult>
 */
export async function checkIfLocked(email: string): Promise<VerificationResult> {
  try {
    const signup = await prisma.waitlistSignup.findUnique({
      where: { email },
      select: {
        lockedUntil: true,
        verificationAttempts: true
      }
    })

    if (!signup) {
      return {
        success: false,
        error: 'Signup not found'
      }
    }

    const now = new Date()
    const isLocked = Boolean(signup.lockedUntil && signup.lockedUntil > now)

    return {
      success: true,
      isLocked,
      lockUntil: signup.lockedUntil || undefined,
      data: {
        verificationAttempts: signup.verificationAttempts,
        lockedUntil: signup.lockedUntil
      }
    }
  } catch (error) {
    console.error('Error checking if account is locked:', error)
    return {
      success: false,
      error: 'Failed to check lock status'
    }
  }
}

/**
 * Updates the verification code for a signup
 * @param email - Email address of the signup
 * @param newCode - New 6-character verification code
 * @returns Promise<SignupResult>
 */
export async function updateVerificationCode(email: string, newCode: string): Promise<SignupResult> {
  try {
    console.log('[DB] Updating verification code:', { email, newCode })
    
    const signup = await prisma.waitlistSignup.update({
      where: { email },
      data: {
        verificationCode: newCode,
        verificationAttempts: 0, // Reset attempts when new code is generated
        lockedUntil: null // Remove any existing lock
      }
    })

    console.log('[DB] Update successful:', { email, updatedCode: signup.verificationCode })

    return {
      success: true,
      data: signup
    }
  } catch (error) {
    console.error('[DB] Error updating verification code:', error)
    return {
      success: false,
      error: 'Failed to update verification code'
    }
  }
}

/**
 * Logs a verification attempt for audit purposes
 * @param email - Email address that attempted verification
 * @param code - Verification code that was attempted
 * @param success - Whether the verification was successful
 * @param ipAddress - IP address of the attempt
 * @returns Promise<SignupResult>
 */
export async function logVerificationAttempt(
  email: string,
  code: string,
  success: boolean,
  ipAddress: string
): Promise<SignupResult> {
  try {
    const attempt = await prisma.verificationAttempt.create({
      data: {
        email,
        attemptedCode: code,
        wasSuccessful: success,
        ipAddress
      }
    })

    return {
      success: true,
      data: attempt
    }
  } catch (error) {
    console.error('Error logging verification attempt:', error)
    return {
      success: false,
      error: 'Failed to log verification attempt'
    }
  }
}

/**
 * Gets the total count of verified signups
 * @returns Promise<number>
 */
export async function getVerifiedSignupCount(): Promise<number> {
  try {
    const count = await prisma.waitlistSignup.count({
      where: {
        isVerified: true
      }
    })

    return count
  } catch (error) {
    console.error('Error getting verified signup count:', error)
    return 0
  }
}

/**
 * Gets a user's signup number based on when they signed up
 * @param email - Email address of the user
 * @returns Promise<number | null> - The signup number (3246 + total records) or null if not found
 */
export async function getUserSignupNumber(email: string): Promise<number | null> {
  try {
    // Get the user's signup record
    const userSignup = await prisma.waitlistSignup.findUnique({
      where: { email },
      select: { createdAt: true }
    })

    if (!userSignup) {
      return null
    }

    // Count how many signups were created before this user
    const signupNumber = await prisma.waitlistSignup.count({
      where: {
        createdAt: {
          lte: userSignup.createdAt
        }
      }
    })

    // Return 3246 + the total number of records at that moment
    return 3246 + signupNumber
  } catch (error) {
    console.error('Error getting user signup number:', error)
    return null
  }
}

/**
 * Gets statistics about verification attempts for monitoring
 * @param email - Optional email to filter by
 * @param hours - Number of hours to look back (default: 24)
 * @returns Promise with attempt statistics
 */
export async function getVerificationAttemptStats(
  email?: string,
  hours: number = 24
): Promise<{
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  uniqueEmails: number
}> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    const whereClause = {
      timestamp: {
        gte: since
      },
      ...(email && { email })
    }

    const [totalAttempts, successfulAttempts, uniqueEmails] = await Promise.all([
      prisma.verificationAttempt.count({ where: whereClause }),
      prisma.verificationAttempt.count({ 
        where: { ...whereClause, wasSuccessful: true } 
      }),
      prisma.verificationAttempt.groupBy({
        by: ['email'],
        where: whereClause,
        _count: true
      })
    ])

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts: totalAttempts - successfulAttempts,
      uniqueEmails: uniqueEmails.length
    }
  } catch (error) {
    console.error('Error getting verification attempt stats:', error)
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      uniqueEmails: 0
    }
  }
}

/**
 * Cleanup function to remove expired locks and old verification attempts
 * @param daysToKeep - Number of days to keep verification attempts (default: 30)
 * @returns Promise<SignupResult>
 */
export async function cleanupExpiredData(daysToKeep: number = 30): Promise<SignupResult> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    
    // Remove expired locks
    await prisma.waitlistSignup.updateMany({
      where: {
        lockedUntil: {
          lt: new Date()
        }
      },
      data: {
        lockedUntil: null
      }
    })

    // Remove old verification attempts
    const deletedAttempts = await prisma.verificationAttempt.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    })

    return {
      success: true,
      data: {
        deletedAttempts: deletedAttempts.count,
        cutoffDate
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired data:', error)
    return {
      success: false,
      error: 'Failed to cleanup expired data'
    }
  }
}
