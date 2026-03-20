'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Planet({ data, isClicked, onHover, onClick }) {
  const groupRef       = useRef()
  const meshRef        = useRef()
  const glowRef        = useRef()
  const [hovered, setHovered] = useState(false)

  const scaleRef       = useRef(1)
  const glowOpacityRef = useRef(0)

  // Load photo texture — meshBasicMaterial shows it exactly as-is (no lighting distortion)
  useEffect(() => {
    if (!data.texture) return
    const loader = new THREE.TextureLoader()
    loader.load(data.texture, (tex) => {
      const mat = meshRef.current?.material
      if (!mat) return
      tex.colorSpace  = THREE.SRGBColorSpace
      mat.map         = tex
      mat.needsUpdate = true
    })
  }, [data.texture])

  useFrame(({ clock, camera }) => {
    if (!groupRef.current || !meshRef.current) return
    const t     = clock.getElapsedTime()
    const phase = data.position[0] * 0.31

    // Float only on Y — smaller amplitude on mobile to prevent clipping
    const floatAmp = data.isMobile ? 0.07 : 0.18
    groupRef.current.position.y = data.position[1] + Math.sin(t * 0.38 + phase) * floatAmp

    // Billboard — circle always faces the camera, photo never distorts
    meshRef.current.quaternion.copy(camera.quaternion)

    // Scale on hover/click
    const active      = hovered || isClicked
    const targetScale = active ? 1.08 : 1.0
    scaleRef.current  = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.08)
    groupRef.current.scale.setScalar(scaleRef.current)

    // Glow opacity
    const targetGlow       = active ? 1.0 : 0.0
    glowOpacityRef.current = THREE.MathUtils.lerp(glowOpacityRef.current, targetGlow, 0.06)

    if (glowRef.current?.material) {
      const breathe = 1 + glowOpacityRef.current * 0.08 + Math.sin(t * 1.6) * glowOpacityRef.current * 0.025
      glowRef.current.material.opacity = glowOpacityRef.current * 0.22
      glowRef.current.scale.setScalar(breathe)
    }
  })

  return (
    <group ref={groupRef} position={data.position}>

      {/* ── Flat circle with photo — no sphere distortion ── */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(data) }}
        onPointerOut={() => { setHovered(false); onHover(null) }}
        onClick={(e) => { e.stopPropagation(); onClick(data) }}
      >
        <circleGeometry args={[data.radius, 128]} />
        <meshBasicMaterial color="#ffffff" transparent />
      </mesh>

      {/* ── Outer glow sphere — drives the Bloom halo ── */}
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

      {/* ── Saturn rings (optional) ── */}
      {data.hasRings && (
        <group rotation={[Math.PI / 3.2, 0.2, 0]}>
          <mesh>
            <torusGeometry args={[data.radius * 1.9, 0.09, 4, 120]} />
            <meshStandardMaterial
              color={data.ringColor}
              emissive={data.ringColor}
              emissiveIntensity={1.0}
              transparent
              opacity={0.75}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[data.radius * 2.28, 0.04, 4, 120]} />
            <meshStandardMaterial
              color={data.ringColor}
              emissive={data.ringColor}
              emissiveIntensity={0.5}
              transparent
              opacity={0.3}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
