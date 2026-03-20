'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'

export default function Cursor({ hoveredPlanet }) {
  const rawX = useMotionValue(-200)
  const rawY = useMotionValue(-200)

  // Spring-smoothed cursor — feels like it has gentle inertia
  const x = useSpring(rawX, { stiffness: 520, damping: 42, mass: 0.4 })
  const y = useSpring(rawY, { stiffness: 520, damping: 42, mass: 0.4 })

  useEffect(() => {
    const onMove = (e) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [rawX, rawY])

  const color = hoveredPlanet?.color ?? 'rgba(255,255,255,0.72)'
  const armLen = hoveredPlanet ? 22 : 14
  const dotSize = hoveredPlanet ? 5 : 2.5

  return (
    // Container anchored at exact mouse position (0,0 origin)
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x,
        y,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Horizontal arm */}
      <motion.div
        animate={{ width: armLen, x: -armLen / 2, backgroundColor: color }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ height: 1, position: 'absolute', top: -0.5 }}
      />
      {/* Vertical arm */}
      <motion.div
        animate={{ height: armLen, y: -armLen / 2, backgroundColor: color }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ width: 1, position: 'absolute', left: -0.5 }}
      />
      {/* Center dot */}
      <motion.div
        animate={{
          width: dotSize,
          height: dotSize,
          x: -dotSize / 2,
          y: -dotSize / 2,
          backgroundColor: color,
        }}
        transition={{ duration: 0.3 }}
        style={{ borderRadius: '50%', position: 'absolute' }}
      />
      {/* Outer ring — only on hover */}
      <AnimatePresence>
        {hoveredPlanet && (
          <motion.div
            key="ring"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.55 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{
              position: 'absolute',
              width: 40,
              height: 40,
              x: -20,
              y: -20,
              borderRadius: '50%',
              border: `1px solid ${color}`,
              boxShadow: `0 0 6px ${color}44`,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
