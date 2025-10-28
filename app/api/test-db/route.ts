import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { testSupabaseConnection } from '@/lib/supabase'

/**
 * GET /api/test-db
 * Test database connectivity
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[DB Test] Starting database connection test...')
    
    // Test 1: Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable not set',
        tests: {
          envVar: false,
          prisma: false,
          supabase: false
        }
      }, { status: 500 })
    }

    console.log('[DB Test] DATABASE_URL is set:', databaseUrl.startsWith('postgresql://'))

    // Test 2: Test Prisma connection
    let prismaTest = false
    try {
      const count = await prisma.waitlistSignup.count()
      prismaTest = true
      console.log('[DB Test] Prisma connection successful, count:', count)
    } catch (error) {
      console.error('[DB Test] Prisma connection failed:', error)
    }

    // Test 3: Test Supabase connection (if configured)
    let supabaseTest = false
    try {
      const supabaseResult = await testSupabaseConnection()
      supabaseTest = supabaseResult.success
      console.log('[DB Test] Supabase connection:', supabaseResult.success)
    } catch (error) {
      console.error('[DB Test] Supabase connection failed:', error)
    }

    return NextResponse.json({
      success: prismaTest,
      tests: {
        envVar: !!databaseUrl,
        prisma: prismaTest,
        supabase: supabaseTest
      },
      databaseUrl: databaseUrl.substring(0, 20) + '...' // Show first 20 chars only
    })

  } catch (error) {
    console.error('[DB Test] Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: {
        envVar: false,
        prisma: false,
        supabase: false
      }
    }, { status: 500 })
  }
}
