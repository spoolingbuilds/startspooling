import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import EmailForm from '@/components/EmailForm'
import ScrollAnimatedSection from '@/components/ScrollAnimatedSection'
import PageAnalytics from '@/components/PageAnalytics'
import StatsCounter from '@/components/StatsCounter'

/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  // TODO: implement the impossible                              │
 * │  // TODO: bridge the gap between garage and cloud              │
 * │  // TODO: make 2am breakthroughs searchable                    │
 * │  // TODO: turn wrench time into data time                      │
 * │  // TODO: connect the dots that nobody else sees               │
 * │                                                                 │
 * │  // if you're reading this and you get it...                  │
 * │  // if you see what we're really building...                  │
 * │  // if you want to help us ship the impossible...              │
 * │                                                                 │
 * │  // team@startspooling.com                                    │
 * │  // tell us what you see.                                     │
 * └─────────────────────────────────────────────────────────────────┘
 */

// Dynamically import SpoolAnimation to reduce initial bundle size
const SpoolAnimation = dynamic(() => import('@/components/SpoolAnimation'), {
  loading: () => (
    <div className="w-full flex items-center justify-center" style={{ minHeight: '600px' }}>
      <div className="w-16 h-16 border-2 border-accent-cyan border-t-transparent rounded-none animate-spin"></div>
    </div>
  ),
  ssr: false
})

export const metadata: Metadata = {
  // Uses default metadata from layout.tsx
}

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://startspooling.com/#organization",
        "name": "StartSpooling",
        "url": "https://startspooling.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://startspooling.com/logo.png",
          "width": 200,
          "height": 200
        },
        "description": "Every build thread you've lost. Every part number you forgot. Every progress photo scattered across platforms. We remember everything.",
        "sameAs": [
          "https://twitter.com/startspooling",
          "https://instagram.com/startspooling",
          "https://discord.gg/startspooling"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://startspooling.com/#website",
        "url": "https://startspooling.com",
        "name": "StartSpooling",
        "description": "Every build thread you've lost. Every part number you forgot. Every progress photo scattered across platforms. We remember everything.",
        "publisher": {
          "@id": "https://startspooling.com/#organization"
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": "https://startspooling.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        ]
      }
    ]
  }

  return (
    <>
      <PageAnalytics pageName="landing" path="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-background text-text-primary">
        {/* Hero Section - Full Viewport Height */}
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* SpoolAnimation */}
          <div className="mb-8">
            <SpoolAnimation />
          </div>
          
          {/* Headline */}
          <h1 className="text-[2rem] sm:text-[2.5rem] lg:text-[3.5rem] font-bold leading-[1.2] text-white text-center lowercase">
            photobucket deleted it.<br />
            forums lost it.<br />
            instagram buried it.
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl font-medium text-white text-center lowercase mt-4" style={{ textShadow: '0 0 10px #00ffff' }}>
            we didn't.
          </p>
          
          {/* Email Form */}
          <div className="pt-4">
            <EmailForm />
            <StatsCounter />
          </div>
        </div>
      </main>

      {/* Below Fold - Cryptic Messages */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <ScrollAnimatedSection delay={0}>
            <hr className="border-gray-600 mb-4" />
            <p className="text-[0.9rem] text-[#666666]">
              followed that build for 4 years<br />
              can't find it now
            </p>
          </ScrollAnimatedSection>
          
          <ScrollAnimatedSection delay={300}>
            <hr className="border-gray-600 mb-4" />
            <p className="text-[0.9rem] text-[#666666]">
              forum thread: 847 pages<br />
              search: broken
            </p>
          </ScrollAnimatedSection>
          
          <ScrollAnimatedSection delay={600}>
            <hr className="border-gray-600 mb-4" />
            <p className="text-[0.9rem] text-[#666666]">
              instagram post from last week<br />
              already buried
            </p>
          </ScrollAnimatedSection>
          
          <ScrollAnimatedSection delay={900}>
            <hr className="border-gray-600 mb-4" />
            <p className="text-[0.9rem] text-[#666666]">
              your wastegate is open.<br />
              want to close it?
            </p>
          </ScrollAnimatedSection>
          
          <ScrollAnimatedSection delay={1200}>
            <hr className="border-gray-600" />
          </ScrollAnimatedSection>
        </div>
      </section>
      </div>
    </>
  )
}
