'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function CameraController({ target, isMobile }) {
  const { camera } = useThree()
  const isZooming = useRef(false)
  const zoomProg  = useRef(0)
  const startPos  = useRef(new THREE.Vector3())
  const endPos    = useRef(new THREE.Vector3())
  const lookAt    = useRef(new THREE.Vector3(0, 0.2, 0))

  useEffect(() => {
    // Jump directly to the right Z so there's no slow lerp on first load
    const z = isMobile ? 16 : 10
    camera.position.set(0, 1.5, z)
  }, [isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (target) {
      isZooming.current = true
      zoomProg.current  = 0
      startPos.current.copy(camera.position)

      const planetPos = new THREE.Vector3(...target.position)
      const dir       = planetPos.clone().sub(camera.position).normalize()
      const dist      = camera.position.distanceTo(planetPos) - (target.radius + 2.6)

      endPos.current.copy(camera.position).addScaledVector(dir, dist)
      lookAt.current.copy(planetPos)
    } else {
      isZooming.current = false
      zoomProg.current  = 0
      lookAt.current.set(0, 0.2, 0)
    }
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()

    if (isZooming.current && target) {
      zoomProg.current = Math.min(zoomProg.current + delta * 0.52, 1)
      const eased = easeInOutQuart(zoomProg.current)
      camera.position.lerpVectors(startPos.current, endPos.current, eased)
      camera.lookAt(lookAt.current)
    } else {
      // Mobile: minimal horizontal drift (planets are vertical, stay centered)
      // Desktop: wider horizontal sweep
      const driftX = isMobile ? Math.sin(t * 0.07) * 0.3 : Math.sin(t * 0.07) * 2.2
      const driftY = isMobile ? 1.5 + Math.cos(t * 0.05) * 0.12 : Math.cos(t * 0.05) * 0.85
      const driftZ = isMobile
        ? 16 + Math.sin(t * 0.03) * 0.4
        : 10 + Math.sin(t * 0.03) * 1.1

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, driftX, 0.012)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, driftY, 0.012)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, driftZ, 0.012)
      camera.lookAt(0, isMobile ? 1.5 : 0.2, 0)
    }
  })

  return null
}

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}
