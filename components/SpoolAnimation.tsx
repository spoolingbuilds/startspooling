'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { analytics } from '@/lib/analytics'

interface SpoolAnimationProps {
  className?: string
  enableInteraction?: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number
  angle: number
  trail: Array<{ x: number; y: number; age: number }>
  speed: number
  color: { r: number; g: number; b: number }
  maxSize: number
}

// Enhanced color profiles with red-orange peak
const getColorBySpeed = (speed: number) => {
  if (speed < 15) {
    // Idle - dim cyan
    const opacity = 0.3 + (speed / 15) * 0.2
    return { r: 0, g: 255, b: 255, opacity }
  } else if (speed < 40) {
    // Acceleration - brightening cyan
    const t = (speed - 15) / 25
    const opacity = 0.5 + t * 0.5
    return { r: 0, g: 255, b: 255, opacity }
  } else if (speed < 50) {
    // Transition to peak - cyan to red-orange
    const t = (speed - 40) / 10
    return { 
      r: Math.floor(t * 255), 
      g: Math.floor(255 - t * 51), 
      b: Math.floor(255 - t * 255),
      opacity: 0.8 + t * 0.2
    }
  } else if (speed < 60) {
    // Peak - red-orange
    return { r: 255, g: 51, b: 0, opacity: 1.0 }
  } else {
    // Overboost - intense red-orange
    const t = Math.min(1, (speed - 60) / 20)
    return { 
      r: 255, 
      g: Math.floor(51 - t * 20), 
      b: 0,
      opacity: 1.0
    }
  }
}

export default function SpoolAnimation({ 
  className = '',
  enableInteraction = true 
}: SpoolAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const rotationSpeedRef = useRef(0)
  const targetSpeedRef = useRef(0.5)
  const timeRef = useRef(0)
  const mouseYRef = useRef(0.5)
  const isHoveredRef = useRef(false)
  const lastInteractionRef = useRef(0)
  const isTabVisibleRef = useRef(true)
  const isInViewportRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const turboLagStateRef = useRef({ spooling: false, lastBoost: 0, currentLag: 0 })

  // Animation state
  const [isVisible, setIsVisible] = useState(false)

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024

  // Turbo lag acceleration curve with delay
  const applyTurboLag = (target: number, current: number, deltaTime: number): number => {
    const { spooling, lastBoost, currentLag } = turboLagStateRef.current
    const turboLagDelay = 0.15 // Seconds before turbo kicks in
    const boostRequest = target > 20
    
    // If we're requesting boost and not spooling yet, start the lag timer
    if (boostRequest && !spooling && Date.now() - lastBoost > 500) {
      turboLagStateRef.current.spooling = true
      turboLagStateRef.current.currentLag = turboLagDelay
      turboLagStateRef.current.lastBoost = Date.now()
    }
    
    // When boost stops, reset lag state
    if (!boostRequest && spooling) {
      turboLagStateRef.current.spooling = false
      turboLagStateRef.current.currentLag = 0
    }
    
    let drag = 0.94
    
    // During turbo lag, reduce responsiveness
    if (spooling && currentLag > 0) {
      turboLagStateRef.current.currentLag -= deltaTime
      drag = 0.98 // Very slow to respond during lag
    }
    
    // Exponential acceleration curve - slow to start, then explosive
    const speed = turboLagStateRef.current.currentLag > 0 
      ? current * drag 
      : current + (target - current) * (1 - drag)
    
    return speed
  }

  // Aggressive easing functions
  const easeInOutQuart = (t: number): number => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
  }

  const easeInQuad = (t: number): number => {
    return t * t
  }

  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4)
  }

  // Screen shake effect
  const getScreenShake = (speed: number): { x: number; y: number } => {
    if (speed < 50) return { x: 0, y: 0 }
    const intensity = Math.min(2, (speed - 50) / 20)
    return {
      x: (Math.random() - 0.5) * intensity,
      y: (Math.random() - 0.5) * intensity
    }
  }

  // Generate particle at edge with enhanced properties
  const spawnParticle = (canvas: HTMLCanvasElement, speed: number): Particle => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const angle = Math.random() * Math.PI * 2
    const distance = Math.sqrt(canvas.width * canvas.height) * 0.4
    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance
    
    const color = getColorBySpeed(speed)
    const baseSize = 2 + Math.random() * 3
    const maxSize = baseSize * (1 + speed / 50) // Larger particles at higher speeds
    
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      age: 0,
      life: 80 + Math.random() * 100,
      size: baseSize,
      angle: Math.random() * Math.PI * 2,
      trail: [],
      speed: 0,
      color: { r: color.r, g: color.g, b: color.b },
      maxSize
    }
  }

  // Draw the compressor wheel with enhanced aggressive styling
  const drawCompressorWheel = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    rotation: number,
    speed: number
  ) => {
    const color = getColorBySpeed(speed)
    const shake = getScreenShake(speed)
    
    ctx.save()
    ctx.translate(centerX + shake.x, centerY + shake.y)
    ctx.rotate(rotation)

    // Draw radial blades with enhanced speed-based styling
    const bladeCount = 16
    const bladeLength = radius * 0.9
    const bladeWidth = 4 + (speed / 50) * 3 // Thicker blades at high speed
    
    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2
      ctx.save()
      ctx.rotate(angle)
      
      // Create gradient for blade with enhanced glow
      const gradient = ctx.createLinearGradient(0, 0, bladeLength, 0)
      const glowIntensity = Math.min(1, speed / 60)
      
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.3 + glowIntensity * 0.4})`)
      gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.5 + glowIntensity * 0.3})`)
      gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.8 + glowIntensity * 0.2})`)
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.9 + glowIntensity * 0.1})`)
      
      ctx.strokeStyle = gradient
      ctx.lineWidth = bladeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowBlur = 20 * glowIntensity
      ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`
      ctx.beginPath()
      ctx.moveTo(radius * 0.1, 0)
      ctx.lineTo(bladeLength, 0)
      ctx.stroke()
      
      // Add secondary glow line for high speeds
      if (speed > 30) {
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 * (speed - 30) / 30})`
        ctx.lineWidth = bladeWidth * 0.6
        ctx.shadowBlur = 30
        ctx.beginPath()
        ctx.moveTo(radius * 0.15, 0)
        ctx.lineTo(bladeLength * 0.8, 0)
        ctx.stroke()
      }
      
      // Add tertiary glow for peak speeds
      if (speed > 50) {
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.3 * (speed - 50) / 20})`
        ctx.lineWidth = bladeWidth * 0.4
        ctx.shadowBlur = 40
        ctx.beginPath()
        ctx.moveTo(radius * 0.2, 0)
        ctx.lineTo(bladeLength * 0.6, 0)
        ctx.stroke()
      }
      
      ctx.restore()
    }

    // Draw center hub with intense glow
    const centerRadius = radius * 0.15
    const glowIntensity = Math.min(1, speed / 60)
    
    // Multiple glow layers for intense bloom effect
    for (let i = 0; i < 5; i++) {
      const glowRadius = centerRadius * (1.5 + i * 0.8)
      const alpha = glowIntensity * (0.2 / (i + 1))
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius)
      glowGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`)
      glowGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.6})`)
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Center hub with pulsing effect
    const pulseIntensity = 1 + Math.sin(timeRef.current * 0.02) * 0.2 * glowIntensity
    const hubGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerRadius * pulseIntensity)
    hubGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.9 + glowIntensity * 0.1})`)
    hubGradient.addColorStop(1, `rgba(${Math.floor(color.r * 0.4)}, ${Math.floor(color.g * 0.3)}, ${Math.floor(color.b * 0.5)}, 0.8)`)
    ctx.fillStyle = hubGradient
    ctx.beginPath()
    ctx.arc(0, 0, centerRadius * pulseIntensity, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Draw particles with enhanced trails and motion blur
  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    centerX: number,
    centerY: number,
    speed: number
  ) => {
    const color = getColorBySpeed(speed)
    
    for (const particle of particles) {
      const alpha = Math.max(0.1, 1 - particle.age / particle.life)
      const currentSize = particle.size * alpha * (1 + particle.speed / 40)
      
      // Draw enhanced trail with motion blur
      if (particle.trail.length > 0) {
        ctx.save()
        for (let i = particle.trail.length - 1; i >= 0; i--) {
          const trailPoint = particle.trail[i]
          const trailAlpha = (trailPoint.age / particle.trail.length) * alpha * 0.7
          const trailSize = currentSize * 0.6 * (trailPoint.age / particle.trail.length)
          
          const gradient = ctx.createRadialGradient(
            trailPoint.x, trailPoint.y, 0,
            trailPoint.x, trailPoint.y, trailSize * 3
          )
          gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${trailAlpha * 0.9})`)
          gradient.addColorStop(0.5, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${trailAlpha * 0.4})`)
          gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`)
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(trailPoint.x, trailPoint.y, trailSize * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      
      // Draw main particle with enhanced glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, currentSize * 4
      )
      gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 1.0})`)
      gradient.addColorStop(0.3, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.6})`)
      gradient.addColorStop(0.7, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.3})`)
      gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, currentSize * 4, 0, Math.PI * 2)
      ctx.fill()
      
      // Enhanced motion blur effect at high speeds
      if (particle.speed > 20) {
        const blurLength = Math.min(8, particle.speed / 10)
        ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.4})`
        ctx.lineWidth = currentSize * 0.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(particle.x - particle.vx * blurLength, particle.y - particle.vy * blurLength)
        ctx.stroke()
      }
      
      // Add spiral pattern at peak speeds
      if (speed > 50 && particle.speed > 30) {
        const spiralIntensity = (speed - 50) / 30
        const spiralRadius = currentSize * 2 * spiralIntensity
        const spiralAngle = particle.age * 0.1
        
        ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.3 * spiralIntensity})`
        ctx.lineWidth = currentSize * 0.3
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, spiralRadius, spiralAngle, spiralAngle + Math.PI)
        ctx.stroke()
      }
    }
  }

  // Update particles
  const updateParticles = (
    particles: Particle[],
    canvas: HTMLCanvasElement,
    rotationSpeed: number
  ): Particle[] => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.sqrt(canvas.width * canvas.height) * 0.4

    return particles
      .map(p => {
        // Store previous position for trail
        p.trail.push({ x: p.x, y: p.y, age: p.trail.length })
        
        // Limit trail length
        if (p.trail.length > 8) {
          p.trail.shift()
        }
        
        // Update trail age
        p.trail = p.trail.map(t => ({ ...t, age: t.age + 1 }))
        
        // Update position
        p.x += p.vx
        p.y += p.vy
        p.age++

        // Calculate forces
        const dx = p.x - centerX
        const dy = p.y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)

        // Radial force toward center (intake)
        const intakeForce = 0.5 - dist / maxRadius
        const intakeStrength = Math.max(0, intakeForce) * (1 + rotationSpeed / 10)
        
        p.vx -= Math.cos(angle) * intakeStrength
        p.vy -= Math.sin(angle) * intakeStrength

        // Angular force (rotation due to turbo) - stronger at higher speeds
        const angularVelocity = rotationSpeed * (0.1 + rotationSpeed / 100)
        const tangentialVx = -Math.sin(angle) * angularVelocity
        const tangentialVy = Math.cos(angle) * angularVelocity
        
        p.vx += tangentialVx
        p.vy += tangentialVy

        // Outward force (boost pressure) - increases exponentially with speed
        const boostForce = dist / maxRadius * rotationSpeed * (0.02 + rotationSpeed / 2000)
        p.vx += Math.cos(angle) * boostForce
        p.vy += Math.sin(angle) * boostForce

        // Friction - less friction at high speeds (momentum)
        const frictionFactor = 1 - Math.min(0.05, rotationSpeed / 2000)
        p.vx *= 0.98 * frictionFactor
        p.vy *= 0.98 * frictionFactor
        
        // Calculate particle speed for effects
        p.speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)

        return p
      })
      .filter(p => {
        // Remove dead particles or particles outside bounds
        const dx = p.x - centerX
        const dy = p.y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        return p.age < p.life && dist < maxRadius * 1.5
      })
  }

  // Draw enhanced bloom glow effect with vignette
  const drawBloomGlow = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    speed: number
  ) => {
    const color = getColorBySpeed(speed)
    const glowIntensity = Math.min(1, speed / 60)
    
    if (glowIntensity < 0.1) return
    
    ctx.save()
    
    // Create multiple intense glow layers for bloom effect
    const layers = [
      { radius: 200, intensity: glowIntensity * 0.3 },
      { radius: 300, intensity: glowIntensity * 0.2 },
      { radius: 400, intensity: glowIntensity * 0.15 },
      { radius: 500, intensity: glowIntensity * 0.1 },
    ]
    
    for (const layer of layers) {
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, layer.radius
      )
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${layer.intensity})`)
      gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${layer.intensity * 0.6})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
    
    // Add vignette darkening during spool
    if (speed > 30) {
      const vignetteIntensity = Math.min(0.4, (speed - 30) / 50)
      const vignetteGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(ctx.canvas.width, ctx.canvas.height) * 0.8
      )
      vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)')
      vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity})`)
      
      ctx.fillStyle = vignetteGradient
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
    
    ctx.restore()
  }

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const glowCanvas = glowCanvasRef.current
    
    if (!canvas || !glowCanvas) {
      isAnimatingRef.current = false
      return
    }

    // Only animate if tab is visible and in viewport
    if (!isTabVisibleRef.current || !isInViewportRef.current) {
      isAnimatingRef.current = false
      return
    }

    const ctx = canvas.getContext('2d')
    const glowCtx = glowCanvas.getContext('2d')
    
    if (!ctx || !glowCtx) {
      isAnimatingRef.current = false
      return
    }

    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height)

    // Update time
    timeRef.current += 0.016 // Approx 60fps

    // Calculate target speed based on time (simulating aggressive turbo spool cycle)
    const cycleTime = 5 // Faster cycle in seconds
    const cycleProgress = (timeRef.current % cycleTime) / cycleTime
    
    // Create aggressive spooling pattern with faster acceleration
    let speedMultiplier = 0
    if (cycleProgress < 0.4) {
      // Acceleration phase (2 seconds) - use aggressive easing
      const accelProgress = cycleProgress / 0.4
      speedMultiplier = easeInQuad(accelProgress) * 0.9
    } else if (cycleProgress < 0.5) {
      // Peak phase (0.5 seconds) - brief pause at peak
      speedMultiplier = 0.9
    } else if (cycleProgress < 0.7) {
      // Deceleration phase (1 second) - simulate wastegate opening
      const decelProgress = (cycleProgress - 0.5) / 0.2
      speedMultiplier = 0.9 - easeOutQuart(decelProgress) * 0.8
    } else {
      // Idle phase
      speedMultiplier = 0.1
    }
    
    // Add interactive influence
    if (enableInteraction && isHoveredRef.current) {
      speedMultiplier = Math.min(1, mouseYRef.current * 1.5 + speedMultiplier * 0.7)
    }

    // Apply aggressive turbo lag acceleration curve
    const targetSpeed = 0.5 + speedMultiplier * 80 // Higher max speed
    rotationSpeedRef.current = applyTurboLag(targetSpeed, rotationSpeedRef.current, 0.016)

    const rotationSpeed = rotationSpeedRef.current

    // Spawn particles based on rotation speed - fewer on mobile
    const maxParticles = isMobile ? 25 : isTablet ? 50 : 100 // Reduced particle count for mobile
    const particleLimit = Math.min(particlesRef.current.length, maxParticles)
    
    if (particlesRef.current.length < particleLimit) {
      const spawnRate = Math.floor(2 + rotationSpeed / 3) // More aggressive spawning
      if (Math.random() < spawnRate / 60) {
        particlesRef.current.push(spawnParticle(canvas, rotationSpeed))
      }
    }

    // Update particles
    particlesRef.current = updateParticles(particlesRef.current, canvas, rotationSpeed)

    // Draw bloom glow on separate canvas
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    drawBloomGlow(glowCtx, centerX, centerY, rotationSpeed)

    // Draw particles
    drawParticles(ctx, particlesRef.current, centerX, centerY, rotationSpeed)

    // Draw compressor wheel
    const wheelRadius = Math.min(canvas.width, canvas.height) * 0.35
    
    // Accumulate rotation
    const totalRotation = timeRef.current * rotationSpeed * 0.01
    
    drawCompressorWheel(ctx, centerX, centerY, wheelRadius, totalRotation, rotationSpeed)

    // Schedule next frame
    isAnimatingRef.current = true
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [enableInteraction, isMobile])

  // Start animation if conditions are met
  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return
    
    if (isTabVisibleRef.current && isInViewportRef.current) {
      isAnimatingRef.current = true
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  // Stop animation
  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    const glowCanvas = glowCanvasRef.current
    
    if (!canvas || !glowCanvas) return

    // Responsive sizing based on breakpoints
    let size = 600 // Desktop default
    if (isMobile) {
      size = 300
    } else if (isTablet) {
      size = 400
    }
    
    // Use devicePixelRatio wisely - reduce on mobile for performance
    const dpr = isMobile ? Math.min(1, window.devicePixelRatio) : window.devicePixelRatio || 1
    
    // Set canvas dimensions with device pixel ratio
    canvas.width = size * dpr
    canvas.height = size * dpr
    glowCanvas.width = size * dpr
    glowCanvas.height = size * dpr
    
    const ctx = canvas.getContext('2d')
    const glowCtx = glowCanvas.getContext('2d')
    
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
    if (glowCtx) {
      glowCtx.scale(dpr, dpr)
    }
    
    // Set display size
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    glowCanvas.style.width = `${size}px`
    glowCanvas.style.height = `${size}px`
  }, [isMobile])

  // Handle mouse interaction
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enableInteraction) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    isHoveredRef.current = true
    lastInteractionRef.current = Date.now()
    
    const rect = canvas.getBoundingClientRect()
    const normalizedY = (e.clientY - rect.top) / rect.height
    mouseYRef.current = normalizedY
  }, [enableInteraction])

  const handleMouseLeave = useCallback(() => {
    if (!enableInteraction) return
    isHoveredRef.current = false
  }, [enableInteraction])

  const handleClick = useCallback(() => {
    if (!enableInteraction) return
    
    // Track animation interaction
    analytics.animationInteraction()
    
    // Trigger immediate full spool on click - bypass lag completely
    rotationSpeedRef.current = 75 // Jump to near-peak RPM
    turboLagStateRef.current.spooling = false
    turboLagStateRef.current.currentLag = 0
    lastInteractionRef.current = Date.now()
    
    // Add visual feedback - spawn extra particles
    const canvas = canvasRef.current
    if (canvas) {
      for (let i = 0; i < 10; i++) {
        particlesRef.current.push(spawnParticle(canvas, 75))
      }
    }
  }, [enableInteraction])

  // Handle visibility change (tab not visible)
  const handleVisibilityChange = useCallback(() => {
    isTabVisibleRef.current = document.visibilityState === 'visible'
    
    if (isTabVisibleRef.current && isInViewportRef.current) {
      startAnimation()
    } else {
      stopAnimation()
    }
  }, [startAnimation, stopAnimation])

  // Setup
  useEffect(() => {
    const canvas = canvasRef.current
    const glowCanvas = glowCanvasRef.current
    if (!canvas || !glowCanvas) return

    handleResize()
    setIsVisible(true)

    // Setup intersection observer for performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInViewportRef.current = entry.isIntersecting
          
          if (entry.isIntersecting && isTabVisibleRef.current) {
            startAnimation()
          } else {
            stopAnimation()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(canvas)

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Setup event listeners
    const debounceTimeout = 300
    let debounceTimer: NodeJS.Timeout
    
    const resizeHandler = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(handleResize, debounceTimeout)
    }

    window.addEventListener('resize', resizeHandler)
    
    if (enableInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseleave', handleMouseLeave)
      canvas.addEventListener('click', handleClick)
    }

    // Handle throttled hover fade-out
    const hoverCheckInterval = setInterval(() => {
      if (enableInteraction && !isHoveredRef.current && Date.now() - lastInteractionRef.current > 500) {
        mouseYRef.current = 0.5
      }
    }, 100)

    // Initial animation start if conditions are met
    if (isTabVisibleRef.current) {
      startAnimation()
    }

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', resizeHandler)
      
      if (enableInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseleave', handleMouseLeave)
        canvas.removeEventListener('click', handleClick)
      }
      
      clearInterval(hoverCheckInterval)
      stopAnimation()
    }
  }, [handleResize, handleMouseMove, handleMouseLeave, handleClick, enableInteraction, handleVisibilityChange, startAnimation, stopAnimation])

  return (
    <div className={`relative ${className} w-full flex items-center justify-center`} style={{ 
      minHeight: isMobile ? '300px' : isTablet ? '400px' : '600px' 
    }}>
      {/* Bloom glow layer (behind main animation) */}
      <canvas
        ref={glowCanvasRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          display: 'block',
          width: isMobile ? '300px' : isTablet ? '400px' : '600px',
          height: isMobile ? '300px' : isTablet ? '400px' : '600px',
          maxWidth: '100vw',
          opacity: isVisible ? 0.7 : 0,
          transition: 'opacity 0.5s ease-in-out',
          mixBlendMode: 'screen'
        }}
      />
      {/* Main animation layer */}
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: isMobile ? '300px' : isTablet ? '400px' : '600px',
          height: isMobile ? '300px' : isTablet ? '400px' : '600px',
          maxWidth: '100vw',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          filter: 'drop-shadow(0 0 30px rgba(0, 255, 255, 0.4)) drop-shadow(0 0 60px rgba(255, 51, 0, 0.2))',
          cursor: enableInteraction ? 'pointer' : 'default'
        }}
      />
    </div>
  )
}
