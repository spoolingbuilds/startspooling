'use client'

import { useState, useEffect, useRef } from 'react'

interface StatsCounterProps {
  initialCount?: number
  updateInterval?: number // in milliseconds
  baseOffset?: number // Base offset to add to database count
}

export default function StatsCounter({ 
  initialCount = 0,
  updateInterval = 30000, // 30 seconds
  baseOffset = 3246 // Base offset to add to database count
}: StatsCounterProps) {
  const [count, setCount] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const animationRef = useRef<number>()
  const fetchRef = useRef<NodeJS.Timeout>()

  // Fetch initial count on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        const fetchedCount = (data.count || 0) + baseOffset
        setCount(fetchedCount)
        
        // Only animate if we have a valid count
        if (fetchedCount > 0) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('[StatsCounter] Error fetching count:', error)
        setIsInitialized(true) // Set to true even on error to prevent infinite loading
      }
    }

    fetchCount()
  }, [baseOffset])

  // Set up periodic updates
  useEffect(() => {
    const fetchLatestCount = async () => {
      try {
        const response = await fetch('/api/stats', { cache: 'no-cache' })
        const data = await response.json()
        const newCount = (data.count || 0) + baseOffset
        
        // Only update if count has actually changed
        if (newCount !== count && newCount > 0) {
          setCount(newCount)
        }
      } catch (error) {
        console.error('[StatsCounter] Error fetching latest count:', error)
      }
    }

    // Set up periodic fetch
    fetchRef.current = setInterval(fetchLatestCount, updateInterval)

    return () => {
      if (fetchRef.current) {
        clearInterval(fetchRef.current)
      }
    }
  }, [count, updateInterval, baseOffset])

  // Animate counter
  useEffect(() => {
    if (!isInitialized) return

    let startTime: number | null = null
    const duration = 2000 // 2 seconds
    const start = 0
    const end = count

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out function (ease-out cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(start + (end - start) * easeOutCubic)
      
      setDisplayCount(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [count, isInitialized])

  // Don't render until we have a count
  if (!isInitialized || displayCount === 0) {
    return null
  }

  // Format display text based on count
  const getDisplayText = () => {
    if (displayCount === 0) {
      return 'be first.'
    } else if (displayCount === 1) {
      return '1 already in'
    } else {
      return `${displayCount.toLocaleString()} already know`
    }
  }

  return (
    <div className="text-center text-[0.75rem] text-[#666666] font-mono mt-6 animate-fade-in">
      {getDisplayText()}
    </div>
  )
}

