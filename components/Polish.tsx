'use client'

import { useEffect, useState } from 'react'

/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                      ║
 * ║  if you're reading this, you're the kind of person we want to talk to.             ║
 * ║                                                                                      ║
 * ║  we're building something that matters.                                             ║
 * ║  something that connects the garage to the cloud.                                  ║
 * ║  something that turns 2am breakthroughs into digital reality.                      ║
 * ║                                                                                      ║
 * ║  do you see the patterns?                                                            ║
 * ║  do you understand what we're really building here?                                ║
 * ║                                                                                      ║
 * ║  this isn't just a waitlist.                                                        ║
 * ║  this is the foundation of something bigger.                                        ║
 * ║                                                                                      ║
 * ║  if you get it...                                                                   ║
 * ║  if you want to be part of it...                                                     ║
 * ║                                                                                      ║
 * ║  team@startspooling.com                                                            ║
 * ║                                                                                      ║
 * ║  tell us what you see.                                                               ║
 * ║                                                                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════╝
 */

interface KonamiCodeProps {
  onSuccess: () => void
}

// Konami code easter egg hook
function useKonamiCode(onSuccess: () => void) {
  const [sequence, setSequence] = useState<string[]>([])
  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setSequence(prev => {
        const newSeq = [...prev, e.key].slice(-10)
        
        // Check if sequence matches Konami code
        if (newSeq.length === 10 && newSeq.every((key, i) => key.toLowerCase() === konamiSequence[i].toLowerCase())) {
          onSuccess()
          return []
        }
        
        return newSeq
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSuccess])
}

// Console message component
export function ConsoleMessage() {
  useEffect(() => {
    // Only log once per session to prevent duplicates in StrictMode
    if (!window.sessionStorage.getItem('polish-logged')) {
      console.log('%c👀 looking under the hood?', 'font-size: 16px; color: #00FFFF; font-weight: bold;')
      console.log('%cwe like that. something is coming.', 'font-size: 12px; color: #666;')
      
      // Easter egg for developers
      setTimeout(() => {
        console.log('%c' + `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║  ███████╗████████╗ █████╗ ██████╗ ███████╗██████╗ ██╗   ██╗   ║
    ║  ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██╔══██╗██║   ██║   ║
    ║  ███████╗   ██║   ███████║██████╔╝███████╗██████╔╝██║   ██║   ║
    ║  ╚════██║   ██║   ██╔══██║██╔═══╝ ╚════██║██╔═══╝ ██║   ██║   ║
    ║  ███████║   ██║   ██║  ██║██║     ███████║██║     ╚██████╔╝   ║
    ║  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝      ╚═════╝    ║
    ║                                                              ║
    ║  ██████╗  ██████╗ ██████╗ ██████╗ ███████╗███████╗███████╗    ║
    ║  ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝    ║
    ║  ██████╔╝██║   ██║██████╔╝██████╔╝█████╗  █████╗  ███████╗    ║
    ║  ██╔═══╝ ██║   ██║██╔══██╗██╔═══╝ ██╔══╝  ██╔══╝  ╚════██║    ║
    ║  ██║     ╚██████╔╝██║  ██║██║     ███████╗███████╗███████║    ║
    ║  ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝╚══════╝    ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
        `, 'font-family: monospace; font-size: 8px; color: #00FFFF; line-height: 1;')
        
        console.log('%c' + `
    ┌─────────────────────────────────────────────────────────────┐
    │  you found the source.                                      │
    │                                                             │
    │  we build things that matter.                               │
    │  we solve problems that keep people awake at 2am.           │
    │                                                             │
    │  do you wrench on cars?                                     │
    │  do you write code that makes things faster?                │
    │  do you lead teams that ship impossible things?             │
    │                                                             │
    │  we're assembling something.                               │
    │  something that bridges the gap between                    │
    │  garage dreams and digital reality.                        │
    │                                                             │
    │  if this resonates...                                      │
    │  if you see what we're building...                         │
    │                                                             │
    │  reach out.                                                │
    │                                                             │
    │  team@startspooling.com                                   │
    │                                                             │
    │  tell us what you build.                                   │
    │  tell us what you break.                                    │
    │  tell us what keeps you up at night.                       │
    │                                                             │
    │  we're listening.                                          │
    └─────────────────────────────────────────────────────────────┘
        `, 'font-family: monospace; font-size: 12px; color: #00FFFF; line-height: 1.2; background: rgba(0,0,0,0.8); padding: 10px; border: 1px solid #00FFFF;')
        
        console.log('%c' + `
    ╭─────────────────────────────────────────────────────────────╮
    │  ╔═══════════════════════════════════════════════════════╗  │
    │  ║  ██╗   ██╗██╗███████╗██╗   ██╗██╗  ██╗███████╗██╗   ║  │
    │  ║  ██║   ██║██║██╔════╝██║   ██║██║ ██╔╝██╔════╝██║   ║  │
    │  ║  ██║   ██║██║███████╗██║   ██║█████╔╝ █████╗  ██║   ║  │
    │  ║  ╚██╗ ██╔╝██║╚════██║██║   ██║██╔═██╗ ██╔══╝  ██║   ║  │
    │  ║   ╚████╔╝ ██║███████║╚██████╔╝██║  ██╗███████╗╚██████╔╝ ║  │
    │  ║    ╚═══╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝  ║  │
    │  ╚═══════════════════════════════════════════════════════╝  │
    ╰─────────────────────────────────────────────────────────────╯
        `, 'font-family: monospace; font-size: 6px; color: #666; line-height: 1;')
      }, 3000)
      
      window.sessionStorage.setItem('polish-logged', 'true')
    }
  }, [])
  
  return null
}

// Konami code easter egg component
export function KonamiEasterEgg({ onSuccess }: KonamiCodeProps) {
  useKonamiCode(onSuccess)
  return null
}

// Polish wrapper that adds all polish features
export function Polish() {
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [signupNumber] = useState(() => {
    // This could fetch from localStorage or be passed as prop
    return 3247
  })

  const handleKonamiSuccess = () => {
    setShowEasterEgg(true)
    setTimeout(() => setShowEasterEgg(false), 5000)
  }

  return (
    <>
      <ConsoleMessage />
      <KonamiEasterEgg onSuccess={handleKonamiSuccess} />
      
      {showEasterEgg && (
        <div className="easter-egg">
          <p>you found it.</p>
          <p>you&apos;re #{signupNumber} to discover this.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#999' }}>
            press ESC to close
          </p>
        </div>
      )}
    </>
  )
}

