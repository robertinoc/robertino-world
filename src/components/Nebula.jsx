'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function NebulaCloud({ position, color, count = 400, spread = 7, rotSpeed = 0.012 }) {
  const ref = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.6) * spread
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.35 // flatten Y
      arr[i * 3 + 2] = r * Math.cos(phi) * 0.25                   // flatten Z
    }
    return arr
  }, [count, spread])

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += rotSpeed * 0.01
  })

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.06}
        transparent
        opacity={0.14}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function Nebula() {
  return (
    <>
      {/* Purple cloud near Music planet */}
      <NebulaCloud position={[-13, 3, -20]} color="#6d28d9" count={700} spread={11} rotSpeed={0.008} />
      {/* Cyan cloud near Ideas planet */}
      <NebulaCloud position={[11, -4, -24]} color="#0e7490" count={600} spread={10} rotSpeed={0.010} />
      {/* Amber cloud near Professional planet */}
      <NebulaCloud position={[2, 9, -30]} color="#b45309" count={500} spread={9} rotSpeed={0.007} />
      {/* Deep background wisps */}
      <NebulaCloud position={[-4, -7, -14]} color="#4c1d95" count={300} spread={6} rotSpeed={0.015} />
      <NebulaCloud position={[7, 6, -18]} color="#164e63" count={250} spread={5} rotSpeed={0.009} />
    </>
  )
}
