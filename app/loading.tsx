'use client'

import SpoolAnimation from '@/components/SpoolAnimation'

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* SpoolAnimation in idle state */}
        <div className="mb-8">
          <SpoolAnimation enableInteraction={false} />
        </div>
        
        {/* Minimal Loading Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-mono text-white animate-pulse">
            loading
          </h1>
        </div>
      </div>
    </div>
  )
}
