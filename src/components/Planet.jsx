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

    // Deep charcoal base matching apps.robertino.world
    ctx.fillStyle = '#0e0e0e'
    ctx.fillRect(0, 0, 512, 512)

    // Subtle purple→blue radial vignette in the centre
    const vignette = ctx.createRadialGradient(256, 256, 60, 256, 256, 320)
    vignette.addColorStop(0, '#9B30D018')
    vignette.addColorStop(0.5, '#4A90FF0c')
    vignette.addColorStop(1, 'transparent')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, 512, 512)

    // 4×4 app-card grid — dark cards + red/purple accents like the real site
    const accentRed    = '#e84c4c'
    const accentPurple = '#9B30D0'
    const accentBlue   = '#4A90FF'
    // featured = red, purple, or blue; most are plain #1a1a1a cards
    const cardAccents = [
      accentRed, null, accentBlue, null,
      null, accentPurple, null, accentRed,
      accentBlue, null, accentRed, null,
      null, accentBlue, null, accentPurple,
    ]

    const cols = 4, rows = 4
    const cW = 512 / cols, cH = 512 / rows
    const pad = cW * 0.14
    const gap = 6

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        const accent = cardAccents[idx]
        const x  = c * cW + pad
        const y  = r * cH + pad
        const w  = cW - pad * 2 - gap
        const h  = cH - pad * 2 - gap
        const cr = w * 0.18

        // Card background
        ctx.fillStyle = '#1a1a1a'
        ctx.beginPath()
        ctx.moveTo(x + cr, y)
        ctx.lineTo(x + w - cr, y);         ctx.quadraticCurveTo(x + w, y,     x + w, y + cr)
        ctx.lineTo(x + w, y + h - cr);     ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h)
        ctx.lineTo(x + cr, y + h);         ctx.quadraticCurveTo(x,     y + h, x,     y + h - cr)
        ctx.lineTo(x, y + cr);             ctx.quadraticCurveTo(x,     y,     x + cr, y)
        ctx.closePath()
        ctx.fill()

        // Border — accent colour or subtle gray
        ctx.strokeStyle = accent ? accent + 'bb' : '#2a2a2a'
        ctx.lineWidth   = accent ? 1.8 : 1
        ctx.stroke()

        // Top accent bar on featured cards
        if (accent) {
          const barH = h * 0.12
          const barGrad = ctx.createLinearGradient(x, y, x + w, y)
          barGrad.addColorStop(0, accent + 'cc')
          barGrad.addColorStop(1, accent + '00')
          ctx.fillStyle = barGrad
          ctx.beginPath()
          ctx.moveTo(x + cr, y)
          ctx.lineTo(x + w - cr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + cr)
          ctx.lineTo(x + w, y + barH)
          ctx.lineTo(x, y + barH)
          ctx.lineTo(x, y + cr);     ctx.quadraticCurveTo(x, y, x + cr, y)
          ctx.closePath()
          ctx.fill()
        }

        // Tiny icon placeholder dot in card centre
        const dotColor = accent || '#555555'
        ctx.fillStyle = dotColor + '99'
        ctx.beginPath()
        ctx.arc(x + w / 2, y + h * 0.45, w * 0.14, 0, Math.PI * 2)
        ctx.fill()

        // "PRO" badge on some cards
        if (idx % 5 === 0) {
          ctx.fillStyle = accentRed + 'ee'
          const bx = x + w - 2, by = y + 3, bw = 22, bh = 9
          ctx.beginPath(); ctx.roundRect(bx - bw, by, bw, bh, 3); ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 6px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('PRO', bx - bw / 2, by + 6.5)
        }
      }
    }

    // Faint grid lines to evoke a dashboard feel
    ctx.strokeStyle = '#ffffff08'
    ctx.lineWidth = 0.5
    for (let i = 1; i < cols; i++) {
      ctx.beginPath(); ctx.moveTo(i * cW, 0); ctx.lineTo(i * cW, 512); ctx.stroke()
    }
    for (let i = 1; i < rows; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * cH); ctx.lineTo(512, i * cH); ctx.stroke()
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
