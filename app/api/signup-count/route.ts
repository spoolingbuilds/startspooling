import { NextResponse } from 'next/server'
import { getVerifiedSignupCount } from '@/lib/db'

export async function GET() {
  try {
    const count = await getVerifiedSignupCount()
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching signup count:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
