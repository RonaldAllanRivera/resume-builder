'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  z: number
  size: number
  alpha: number
  glowStrength: number
  twinkleSpeed: number
  twinkleOffset: number
  depthBias: number
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let width = 0
    let height = 0
    let cx = 0
    let cy = 0
    let dpr = 1
    let animationId = 0
    let lastTime = 0
    let time = 0
    let accumulatedYaw = 0

    let sphereRadius = 0
    let focalLength = 0

    const STAR_COUNT = 4300
    const stars: Star[] = []

    let currentYawSpeed = 0.09

    function rand(min: number, max: number): number {
      return Math.random() * (max - min) + min
    }

    function clamp(value: number, min: number, max: number): number {
      return Math.max(min, Math.min(max, value))
    }

    function lerp(start: number, end: number, t: number): number {
      return start + (end - start) * t
    }

    function damp(current: number, target: number, lambda: number, dt: number): number {
      return lerp(current, target, 1 - Math.exp(-lambda * dt))
    }

    function buildStars() {
      stars.length = 0

      for (let i = 0; i < STAR_COUNT; i++) {
        const u = Math.random()
        const v = Math.random()

        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)

        const x = Math.sin(phi) * Math.cos(theta)
        const y = Math.cos(phi)
        const z = Math.sin(phi) * Math.sin(theta)

        const bias = Math.random()

        let size: number
        let alpha: number
        let glowStrength: number

        if (bias < 0.84) {
          size = rand(0.5, 0.9)
          alpha = rand(0.4, 0.7)
          glowStrength = rand(0.0, 0.02)
        } else if (bias < 0.975) {
          size = rand(0.9, 1.4)
          alpha = rand(0.6, 0.85)
          glowStrength = rand(0.0, 0.04)
        } else {
          size = rand(1.4, 2.2)
          alpha = rand(0.75, 1.0)
          glowStrength = rand(0.0, 0.06)
        }

        stars.push({
          x,
          y,
          z,
          size,
          alpha,
          glowStrength,
          twinkleSpeed: rand(0.3, 1.15),
          twinkleOffset: rand(0, Math.PI * 2),
          depthBias: rand(0.94, 1.08),
        })
      }
    }

    function resize() {
      if (!canvas || !ctx) return

      width = window.innerWidth
      height = window.innerHeight
      cx = width * 0.5
      cy = height * 0.5
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true

      sphereRadius = Math.max(width, height) * 0.96
      focalLength = Math.max(width, height) * 1.18

      buildStars()
      drawFrame()
    }

    function clear() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
    }

    function getProceduralSpeed(t: number): number {
      const base = 0.088
      const waveA = Math.sin(t * 0.42) * 0.024
      const waveB = Math.sin(t * 0.91 + 1.7) * 0.012
      const waveC = Math.sin(t * 0.17 + 3.2) * 0.009
      return Math.max(0.06, base + waveA + waveB + waveC)
    }

    function projectStar(star: Star) {
      const yaw = accumulatedYaw
      const pitch = -0.58
      const roll = -0.24

      const cosYaw = Math.cos(yaw)
      const sinYaw = Math.sin(yaw)
      const cosPitch = Math.cos(pitch)
      const sinPitch = Math.sin(pitch)
      const cosRoll = Math.cos(roll)
      const sinRoll = Math.sin(roll)

      const x = star.x
      const y = star.y
      const z = star.z

      const x1 = x * cosYaw - z * sinYaw
      const z1 = x * sinYaw + z * cosYaw
      const y1 = y

      const y2 = y1 * cosPitch - z1 * sinPitch
      const z2 = y1 * sinPitch + z1 * cosPitch
      const x2 = x1

      const x3 = x2 * cosRoll - y2 * sinRoll
      const y3 = x2 * sinRoll + y2 * cosRoll
      const z3 = z2

      const wobbleYaw = Math.sin(time * 0.23) * 0.045
      const wobblePitch = Math.sin(time * 0.16 + 1.9) * 0.03

      const cosWY = Math.cos(wobbleYaw)
      const sinWY = Math.sin(wobbleYaw)
      const cosWP = Math.cos(wobblePitch)
      const sinWP = Math.sin(wobblePitch)

      const x4 = x3 * cosWY - z3 * sinWY
      const z4 = x3 * sinWY + z3 * cosWY
      const y4 = y3

      const y5 = y4 * cosWP - z4 * sinWP
      const z5 = y4 * sinWP + z4 * cosWP
      const x5 = x4

      const depthZ = z5 * sphereRadius * star.depthBias + sphereRadius * 2.05
      const scale = focalLength / depthZ

      return {
        x: cx + x5 * sphereRadius * scale,
        y: cy + y5 * sphereRadius * scale,
        z: depthZ,
        scale,
      }
    }

    function drawStar(x: number, y: number, radius: number, alpha: number, glowStrength: number) {
      if (!ctx) return

      if (glowStrength > 0.02 && radius > 0.7) {
        ctx.beginPath()
        ctx.fillStyle = `rgba(255,255,255,${alpha * glowStrength})`
        ctx.arc(x, y, radius * 2.1, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.beginPath()
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawFrame() {
      clear()

      const visible: Array<{ projected: ReturnType<typeof projectStar>; star: Star }> = []

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        const projected = projectStar(star)

        if (
          projected.x < -18 ||
          projected.x > width + 18 ||
          projected.y < -18 ||
          projected.y > height + 18
        ) {
          continue
        }

        visible.push({
          projected,
          star,
        })
      }

      visible.sort((a, b) => b.projected.z - a.projected.z)

      for (let i = 0; i < visible.length; i++) {
        const item = visible[i]
        const star = item.star
        const projected = item.projected

        const twinkle = 0.92 + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.08

        const perspectiveBoost = clamp(projected.scale * 1.48, 0.62, 1.98)
        const radius = star.size * perspectiveBoost

        const alpha = clamp(star.alpha * twinkle * perspectiveBoost * 1.1, 0.3, 1)

        const glow = clamp(star.glowStrength * perspectiveBoost, 0, 0.34)

        drawStar(projected.x, projected.y, radius, alpha, glow)
      }
    }

    function animate(now: number) {
      if (!lastTime) lastTime = now

      const dt = Math.min((now - lastTime) / 1000, 0.033)
      lastTime = now
      time += dt

      const proceduralSpeed = getProceduralSpeed(time)

      currentYawSpeed = damp(
        currentYawSpeed,
        proceduralSpeed,
        proceduralSpeed > currentYawSpeed ? 1.8 : 0.65,
        dt,
      )

      accumulatedYaw += currentYawSpeed * dt

      drawFrame()
      animationId = requestAnimationFrame(animate)
    }

    resize()
    animationId = requestAnimationFrame(animate)

    window.addEventListener('resize', resize, { passive: true })

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
      style={{ opacity: 1.0 }}
    />
  )
}
