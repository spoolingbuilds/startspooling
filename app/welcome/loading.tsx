'use client'

import LoadingSpinner from '@/components/LoadingSpinner'

export default function WelcomeLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-4">
        <LoadingSpinner size="lg" label="Loading welcome page..." />
      </div>
    </div>
  )
}
