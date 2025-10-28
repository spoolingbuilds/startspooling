'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 Message */}
        <div className="space-y-4">
          <h1 className="text-2xl font-mono text-white">
            lost.
          </h1>
          <p className="text-gray-400 text-sm">
            like your build thread.
          </p>
        </div>

        {/* Back Link */}
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-transparent border border-white text-white hover:bg-white hover:text-black font-medium transition-colors duration-200"
        >
          [back]
        </Link>
      </div>
    </div>
  )
}
