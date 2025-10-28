import { NextRequest, NextResponse } from 'next/server'
import { confirmationEmailTemplate, ConfirmationEmailData } from '@/lib/email-templates'

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Preview route only available in development' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const signupParam = searchParams.get('signup')
  const formatParam = searchParams.get('format')
  const totalParam = searchParams.get('total')

  // Default values
  const signupNumber = signupParam ? parseInt(signupParam, 10) : 1234
  const totalSignups = totalParam ? parseInt(totalParam, 10) : signupNumber
  const format = formatParam || 'html'

  // Generate sample data
  const now = new Date()
  const confirmationData: ConfirmationEmailData = {
    signupNumber,
    totalSignups,
    date: now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    timestamp: now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    completionPercentage: Math.min(Math.floor((signupNumber / totalSignups) * 100), 100),
    crypticStatus: getCrypticStatus(signupNumber)
  }

  // Generate template
  const template = confirmationEmailTemplate(confirmationData)

  // Return based on format
  if (format === 'text') {
    return new NextResponse(template.text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }

  // Return HTML
  return new NextResponse(template.html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

/**
 * Get cryptic status message based on signup number
 */
function getCrypticStatus(signupNumber: number): string {
  const statuses = [
    'building in progress',
    'compiling memories',
    'archive expanding',
    'data streams flowing',
    'connections forming',
    'patterns emerging',
    'systems awakening',
    'networks converging',
    'possibilities unfolding',
    'future crystallizing'
  ]
  
  // Rotate through statuses based on signup number
  const index = (signupNumber - 1) % statuses.length
  return statuses[index]
}
