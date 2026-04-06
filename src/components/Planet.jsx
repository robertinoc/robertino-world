'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function Planet({ data, isClicked, onHover, onClick }) {
  const groupRef       = useRef()
  const meshRef        = useRef()
  const glowRef        = useRef()
  const [hovered, setHovered] = useState(false)

  const isStar        = data.celestialType === 'star'
  const isMarketplace = data.celestialType === 'marketplace'

  const scaleRef       = useRef(1)
  // Stars always glow — planets only on hover/click
  const glowOpacityRef = useRef(isStar ? 0.38 : 0)

  const { gl } = useThree()

  // ── Marketplace procedural canvas texture ─────────────────────────────────
  useEffect(() => {
    if (!isMarketplace) return
    const canvas = document.createElement('canvas')
    canvas.width  = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Dark radial base
    const bg = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    bg.addColorStop(0, '#111827')
    bg.addColorStop(1, '#050810')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 512, 512)

    // 5×5 app-icon grid
    const palette = [
      '#f97316','#a855f7','#06b6d4','#22c55e','#f59e0b',
      '#ec4899','#3b82f6','#10b981','#e11d48','#8b5cf6',
      '#0ea5e9','#84cc16','#f43f5e','#14b8a6','#fb923c',
    ]
    const cols = 5, rows = 5
    const cW = 512 / cols, cH = 512 / rows
    const pad = cW * 0.18

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x  = c * cW + pad
        const y  = r * cH + pad
        const w  = cW - pad * 2
        const cr = w * 0.22
        const cl = palette[(r * cols + c) % palette.length]

        // Soft glow behind icon
        const glow = ctx.createRadialGradient(x + w/2, y + w/2, 0, x + w/2, y + w/2, w)
        glow.addColorStop(0, cl + '30')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(x + w/2, y + w/2, w, 0, Math.PI * 2); ctx.fill()

        // Rounded rect icon
        ctx.fillStyle   = cl + '55'
        ctx.strokeStyle = cl + 'cc'
        ctx.lineWidth   = 1.5
        ctx.beginPath()
        ctx.moveTo(x + cr, y)
        ctx.lineTo(x + w - cr, y);  ctx.quadraticCurveTo(x + w, y,     x + w, y + cr)
        ctx.lineTo(x + w, y + w - cr); ctx.quadraticCurveTo(x + w, y + w, x + w - cr, y + w)
        ctx.lineTo(x + cr, y + w);  ctx.quadraticCurveTo(x,     y + w, x,     y + w - cr)
        ctx.lineTo(x, y + cr);      ctx.quadraticCurveTo(x,     y,     x + cr, y)
        ctx.closePath()
        ctx.fill(); ctx.stroke()

        // "Free" / "Pro" dot indicator on some icons
        if ((r * cols + c) % 4 === 0) {
          ctx.fillStyle = '#ffffff99'
          ctx.beginPath(); ctx.arc(x + w - 7, y + 7, 3.5, 0, Math.PI * 2); ctx.fill()
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = meshRef.current?.material
    if (mat) { mat.map = tex; mat.needsUpdate = true }
  }, [isMarketplace])

  // ── Photo texture (planets only) ──────────────────────────────────────────
  useEffect(() => {
    if (isStar || isMarketplace || !data.texture) return
    const loader = new THREE.TextureLoader()
    loader.load(data.texture, (tex) => {
      const mat = meshRef.current?.material
      if (!mat) return
      tex.colorSpace  = THREE.SRGBColorSpace
      // Anisotropic filtering — keeps photos sharp at oblique angles
      tex.anisotropy  = gl.capabilities.getMaxAnisotropy()
      tex.minFilter   = THREE.LinearMipmapLinearFilter
      tex.magFilter   = THREE.LinearFilter
      tex.generateMipmaps = true
      mat.map         = tex
      mat.needsUpdate = true
    })
  }, [data.texture, isStar, isMarketplace, gl])

  useFrame(({ clock, camera }) => {
    if (!groupRef.current || !meshRef.current) return
    const t     = clock.getElapsedTime()
    const phase = data.position[0] * 0.31 + data.position[1] * 0.17

    const floatAmp = data.isMobile ? 0.07 : 0.18
    groupRef.current.position.y = data.position[1] + Math.sin(t * 0.38 + phase) * floatAmp

    // Billboard — only needed for flat circle planets (not spheres)
    if (!isStar) {
      meshRef.current.quaternion.copy(camera.quaternion)
    }

    const active      = hovered || isClicked
    const targetScale = active ? 1.08 : 1.0
    scaleRef.current  = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.08)
    groupRef.current.scale.setScalar(scaleRef.current)

    if (isStar) {
      // ── Star: constant pulsing glow, intensifies on hover ──
      const basePulse = 0.38 + Math.sin(t * 1.4) * 0.08
      const targetGlow = active ? basePulse + 0.3 : basePulse
      glowOpacityRef.current = THREE.MathUtils.lerp(glowOpacityRef.current, targetGlow, 0.04)
      if (glowRef.current?.material) {
        glowRef.current.material.opacity = glowOpacityRef.current
        const breathe = 1 + Math.sin(t * 1.4) * 0.04
        glowRef.current.scale.setScalar(breathe)
      }
    } else {
      // ── Planet: glow only on hover / click ──
      const targetGlow       = active ? 1.0 : 0.0
      glowOpacityRef.current = THREE.MathUtils.lerp(glowOpacityRef.current, targetGlow, 0.06)
      if (glowRef.current?.material) {
        const breathe = 1 + glowOpacityRef.current * 0.08 + Math.sin(t * 1.6) * glowOpacityRef.current * 0.025
        // Reduced from 0.22 → 0.14 so colour bleed doesn't wash out photos
        glowRef.current.material.opacity = glowOpacityRef.current * 0.14
        glowRef.current.scale.setScalar(breathe)
      }
    }
  })

  const pointerHandlers = {
    onPointerOver: (e) => { e.stopPropagation(); setHovered(true);  onHover(data) },
    onPointerOut:  ()  => {                      setHovered(false); onHover(null) },
    onClick:       (e) => { e.stopPropagation(); onClick(data) },
  }

  return (
    <group ref={groupRef} position={data.position}>

      {isStar ? (
        // ── Star body ────────────────────────────────────────────────────────
        <>
          <mesh ref={meshRef} {...pointerHandlers}>
            <sphereGeometry args={[data.radius, 32, 32]} />
            <meshBasicMaterial color="#dbeafe" />
          </mesh>
          <mesh ref={glowRef} visible={false}>
            <sphereGeometry args={[data.radius * 1.1, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </>
      ) : isMarketplace ? (
        // ── Marketplace body — canvas texture + orbital ring ─────────────────
        <>
          {/* Flat circle with app-grid canvas texture */}
          <mesh ref={meshRef} {...pointerHandlers}>
            <circleGeometry args={[data.radius, 128]} />
            <meshBasicMaterial color="#ffffff" transparent />
          </mesh>

          {/* Coloured glow halo */}
          <mesh ref={glowRef}>
            <sphereGeometry args={[data.radius * 1.28, 32, 32]} />
            <meshBasicMaterial
              color={data.color}
              transparent
              opacity={0}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>

          {/* Orbital ring — evokes app ecosystem orbiting the marketplace */}
          <group rotation={[Math.PI / 2.8, 0.3, 0]}>
            <mesh>
              <torusGeometry args={[data.radius * 1.75, 0.035, 4, 120]} />
              <meshBasicMaterial color={data.ringColor} transparent opacity={0.7} />
            </mesh>
            <mesh>
              <torusGeometry args={[data.radius * 2.1, 0.018, 4, 120]} />
              <meshBasicMaterial color={data.ringColor} transparent opacity={0.35} />
            </mesh>
          </group>
        </>
      ) : (
        // ── Regular planet — flat circle with photo ───────────────────────────
        <>
          <mesh ref={meshRef} {...pointerHandlers}>
            <circleGeometry args={[data.radius, 128]} />
            <meshBasicMaterial color="#ffffff" transparent />
          </mesh>

          <mesh ref={glowRef}>
            <sphereGeometry args={[data.radius * 1.28, 32, 32]} />
            <meshBasicMaterial
              color={data.color}
              transparent
              opacity={0}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </>
      )}

    </group>
  )
}
