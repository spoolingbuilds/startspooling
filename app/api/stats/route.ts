import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/stats
 * 
 * Returns the total count of verified signups.
 * 
 * Response: { count: number }
 */

// Cache for 1 minute to reduce database load
let cachedCount: number | null = null
let cacheExpiry: number = 0
const CACHE_DURATION_MS = 60 * 1000 // 1 minute

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()
    
    // Return cached result if still valid
    if (cachedCount !== null && now < cacheExpiry) {
      return NextResponse.json(
        { count: cachedCount },
        {
          headers: {
            'Cache-Control': 'public, max-age=60',
            'CDN-Cache-Control': 'public, max-age=60',
          }
        }
      )
    }
    
    // Query database for verified signup count
    const actualCount = await prisma.waitlistSignup.count({
      where: {
        isVerified: true
      }
    })
    
    // Round to nearest 100 if > 1000 to make it less obviously real-time
    const displayCount = actualCount > 1000 
      ? Math.floor(actualCount / 100) * 100 
      : actualCount
    
    // Cache the result
    cachedCount = displayCount
    cacheExpiry = now + CACHE_DURATION_MS
    
    return NextResponse.json(
      { count: displayCount },
      {
        headers: {
          'Cache-Control': 'public, max-age=60',
          'CDN-Cache-Control': 'public, max-age=60',
        }
      }
    )
  } catch (error) {
    console.error('[Stats API] Error fetching signup count:', error)
    
    // Return 500 error on database failure
    return NextResponse.json(
      { error: 'Failed to fetch stats', count: 0 },
      { status: 500 }
    )
  }
}

