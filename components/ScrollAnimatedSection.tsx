'use client'

import { useScrollAnimation } from '@/lib/useScrollAnimation'

interface ScrollAnimatedSectionProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export default function ScrollAnimatedSection({ 
  children, 
  delay = 0, 
  className = '' 
}: ScrollAnimatedSectionProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    triggerOnce: true
  })

  return (
    <div
      ref={ref}
      className={`scroll-fade-in ${isVisible ? 'visible' : ''} ${className}`}
      style={{
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}
