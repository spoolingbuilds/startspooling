'use client'

import LoadingSpinner from '@/components/LoadingSpinner'

export default function VerifyLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <LoadingSpinner size="lg" label="Loading verification page..." />
      </div>
    </div>
  )
}
