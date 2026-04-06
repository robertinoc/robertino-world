'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function Planet({ data, isClicked, onHover, onClick }) {
  const groupRef       = useRef()
  const meshRef        = useRef()
  const glowRef        = useRef()
  const innerGlowRef   = useRef()
  const [hovered, setHovered] = useState(false)

  const isStar = data.celestialType === 'star'

  const scaleRef       = useRef(1)
  // Stars always glow — planets only on hover/click
  const glowOpacityRef = useRef(isStar ? 0.38 : 0)

  const { gl } = useThree()

  // ── Photo texture (planets only) ──────────────────────────────────────────
  useEffect(() => {
    if (isStar || !data.texture) return
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
  }, [data.texture, isStar, gl])

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
      if (innerGlowRef.current?.material) {
        innerGlowRef.current.material.opacity = glowOpacityRef.current * 0.3
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
          {/* Bright core sphere */}
          <mesh ref={meshRef} {...pointerHandlers}>
            <sphereGeometry args={[data.radius, 32, 32]} />
            <meshBasicMaterial color={data.color} />
          </mesh>

          {/* Inner halo — close glow ring */}
          <mesh ref={innerGlowRef}>
            <sphereGeometry args={[data.radius * 1.4, 16, 16]} />
            <meshBasicMaterial
              color={data.color}
              transparent
              opacity={0.08}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>

          {/* Outer glow — drives Bloom */}
          <mesh ref={glowRef}>
            <sphereGeometry args={[data.radius * 2.2, 16, 16]} />
            <meshBasicMaterial
              color={data.color}
              transparent
              opacity={0.28}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </>
      ) : (
        // ── Planet body ──────────────────────────────────────────────────────
        <>
          {/* Flat circle with photo */}
          <mesh ref={meshRef} {...pointerHandlers}>
            <circleGeometry args={[data.radius, 128]} />
            <meshBasicMaterial color="#ffffff" transparent />
          </mesh>

          {/* Outer glow — drives Bloom halo */}
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
