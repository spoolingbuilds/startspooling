'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { analytics, FUNNEL_STEPS } from '@/lib/analytics'
import { sendConfirmationEmail } from '@/lib/email'
import PageAnalytics from '@/components/PageAnalytics'

function WelcomeContent() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('')
  const [displayedMessage, setDisplayedMessage] = useState('')
  const [showComingText, setShowComingText] = useState(false)
  const [signupNumber, setSignupNumber] = useState<number | null>(null)
  const [isTyping, setIsTyping] = useState(true)

  // Memoize analytics calls to prevent dependency array issues
  const trackWelcomeView = useCallback((signupNumber: number) => {
    analytics.welcomeView(signupNumber)
    analytics.funnelStep(FUNNEL_STEPS.WELCOME_VIEW, { signupNumber })
  }, [])

  const trackScreenshot = useCallback(() => {
    analytics.welcomeScreenshot()
  }, [])

  // Get stored welcome message and number from database
  useEffect(() => {
    const fetchWelcomeData = async () => {
      try {
        // Only access localStorage/sessionStorage on client side
        let email = null
        if (typeof window !== 'undefined') {
          email = localStorage.getItem('verificationEmail') || 
                  sessionStorage.getItem('userEmail')
        }
        
        if (email) {
          const response = await fetch(`/api/welcome-data?email=${encodeURIComponent(email)}`)
          const data = await response.json()
          
          if (data.welcomeMessageText && data.calculatedNumber) {
            setMessage(data.welcomeMessageText)
            setSignupNumber(data.calculatedNumber)
            
            // Track welcome view
            trackWelcomeView(data.calculatedNumber)
          } else {
            // Fallback to default message and deterministic number
            setMessage('access: granted. status: active.')
            const fallbackNumber = 3246 + 500 // Use deterministic number instead of random
            setSignupNumber(fallbackNumber)
          }
        } else {
          // Fallback if no email found
          setMessage('access: granted. status: active.')
          const fallbackNumber = 3246 + 500 // Use deterministic number instead of random
          setSignupNumber(fallbackNumber)
        }
      } catch (error) {
        console.error('Error fetching welcome data:', error)
        // Fallback to default message and deterministic number
        setMessage('access: granted. status: active.')
        const fallbackNumber = 3246 + 500 // Use deterministic number instead of random
        setSignupNumber(fallbackNumber)
      }
    }

    fetchWelcomeData()
  }, [trackWelcomeView])

  // Send confirmation email when user data is available
  useEffect(() => {
    const sendConfirmationEmailAsync = async () => {
      try {
        // Only access localStorage/sessionStorage on client side
        let email = null
        if (typeof window !== 'undefined') {
          email = localStorage.getItem('verificationEmail') ||
                  sessionStorage.getItem('userEmail')
        }

        if (email && signupNumber) {
          // Send confirmation email asynchronously (don't await)
          sendConfirmationEmail(email, signupNumber, signupNumber) // Using signupNumber as totalSignups fallback
            .then((result) => {
              if (result.success) {
                console.log('Confirmation email sent successfully to:', email)
                // Analytics tracking is now handled in the email.ts file
              } else {
                console.error('Failed to send confirmation email:', result.error)
                // Silent failure - don't show error to user
              }
            })
            .catch((error) => {
              console.error('Error sending confirmation email:', error)
              // Silent failure - don't block user experience
            })
        }
      } catch (error) {
        console.error('Error in confirmation email logic:', error)
        // Silent failure - don't block user experience
      }
    }

    // Only send email if we have both email and signup number
    if (signupNumber) {
      sendConfirmationEmailAsync()
    }
  }, [signupNumber]) // Depend on signupNumber so it runs when data is available

  // Typewriter effect
  useEffect(() => {
    if (!message) return
    
    let index = 0
    const timer = setInterval(() => {
      if (index <= message.length) {
        setDisplayedMessage(message.slice(0, index))
        index++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, 30)

    return () => clearInterval(timer)
  }, [message])

  // Show "something is coming" after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowComingText(true)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])


  // Detect screenshot attempts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 's')) {
        trackScreenshot()
      }
    }
    
    // Detect right-click context menu (often used for copying)
    const handleContextMenu = () => {
      trackScreenshot()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', handleContextMenu)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [trackScreenshot])

  // Determine message color based on theme
  const getMessageColor = (msg: string) => {
    const technicalKeywords = ['boost', 'pressure', 'compression', 'timing', 'wastegate', 'intercooler', 'vtec', 'turbo', 'fuel', 'launch', 'redline']
    const hasTechnicalKeyword = technicalKeywords.some(keyword => msg.toLowerCase().includes(keyword))
    
    return hasTechnicalKeyword ? 'text-[#00FFFF]' : 'text-white'
  }

  return (
    <>
      <PageAnalytics pageName="welcome" path="/welcome" />
      {/* ASCII Art Easter Egg for Welcome Page */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            /*
            ╔══════════════════════════════════════════════════════════════════════════════════════╗
            ║                                                                                      ║
            ║  ██╗    ██╗███████╗██╗     ███████╗ ██████╗ ███╗   ███╗███████╗                      ║
            ║  ██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝                      ║
            ║  ██║ █╗ ██║█████╗  ██║     █████╗  ██║   ██║██╔████╔██║█████╗                        ║
            ║  ██║███╗██║██╔══╝  ██║     ██╔══╝  ██║   ██║██║╚██╔╝██║██╔══╝                        ║
            ║  ╚███╔███╔╝███████╗███████╗███████╗╚██████╔╝██║ ╚═╝ ██║███████╗                      ║
            ║   ╚══╝╚══╝ ╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝                      ║
            ║                                                                                      ║
            ║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
            ║  │  access: granted.                                                           │  ║
            ║  │                                                                             │  ║
            ║  │  you made it through the gates.                                            │  ║
            ║  │  you're part of something bigger now.                                      │  ║
            ║  │                                                                             │  ║
            ║  │  the garage meets the cloud.                                               │  ║
            ║  │  the impossible becomes searchable.                                        │  ║
            ║  │  the 2am breakthroughs get remembered.                                     │  ║
            ║  │                                                                             │  ║
            ║  │  if you're reading this...                                                 │  ║
            ║  │  if you understand what we're building...                                 │  ║
            ║  │  if you want to help us ship the impossible...                              │  ║
            ║  │                                                                             │  ║
            ║  │  team@startspooling.com                                                   │  ║
            ║  │  tell us what you see.                                                      │  ║
            ║  └─────────────────────────────────────────────────────────────────────────────┘  ║
            ║                                                                                      ║
            ╚══════════════════════════════════════════════════════════════════════════════════════╝
            */
          `,
        }}
      />
      <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
        {/* Main Message */}
        <div className="text-center px-4 max-w-[90%] mx-auto">
          <div 
            className={`text-[1.75rem] sm:text-[2.5rem] lg:text-[3rem] font-mono leading-[1.7] animate-pulse ${getMessageColor(message)} opacity-0 animate-fade-in`}
            style={{
              textShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
            }}
          >
            {displayedMessage}
            {isTyping && <span className="animate-pulse">|</span>}
          </div>
        </div>

        {/* Signup Number */}
        {signupNumber && (
          <div className="absolute bottom-8 sm:bottom-5 left-1/2 transform -translate-x-1/2 text-[#333333] font-mono text-[0.65rem] sm:text-xs opacity-0 animate-fade-in-delayed">
            #{signupNumber.toLocaleString()}
          </div>
        )}

        {/* Something is coming text */}
        {showComingText && (
          <div className="absolute bottom-20 sm:bottom-16 left-1/2 transform -translate-x-1/2 text-[#666666] text-sm font-mono opacity-0 animate-fade-in">
            something is coming.
          </div>
        )}

        {/* Cryptic screenshot easter egg */}
        {showComingText && (
          <div className="absolute bottom-32 sm:bottom-28 left-1/2 transform -translate-x-1/2 text-[#444444] text-xs font-mono opacity-0 animate-fade-in-delayed cursor-pointer hover:text-[#666666] transition-colors duration-300"
               onClick={() => {
                 // Trigger screenshot detection
                 trackScreenshot()
                 // Show a subtle hint
                 console.log('%c📸 capture this moment', 'font-size: 12px; color: #00FFFF;')
               }}
               title="hint">
            save this. you'll need it.
          </div>
        )}
      </div>
    </>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white font-mono text-lg opacity-50">loading...</div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  )
}