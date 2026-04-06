'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ── ScreenPositionTracker ─────────────────────────────────────────────────
// Lives inside <Canvas>. Every frame it projects the 3D planet positions
// (including float animation) to 2D screen pixels and writes to hudPosRef.
// Zero re-renders, zero DOM side-effects — pure ref mutation.
export function ScreenPositionTracker({ planets, hudPosRef }) {
  const { camera, size } = useThree()
  const v = useRef(new THREE.Vector3())

  useFrame(({ clock }) => {
    const t    = clock.getElapsedTime()
    const next = {}

    planets.forEach((p) => {
      // Mirror the float animation in Planet.jsx so the label tracks the actual planet
      const phase    = p.position[0] * 0.31
      const floatAmp = p.isMobile ? 0.07 : 0.18
      const floatY   = Math.sin(t * 0.38 + phase) * floatAmp

      v.current.set(p.position[0], p.position[1] + floatY, p.position[2])
      v.current.project(camera)

      next[p.id] = {
        x: ( v.current.x * 0.5 + 0.5) * size.width,
        y: (-v.current.y * 0.5 + 0.5) * size.height,
      }
    })

    hudPosRef.current = next
  })

  return null
}

// ── PlanetHUDLabel ────────────────────────────────────────────────────────
function PlanetHUDLabel({ planet, side, dimmed }) {
  const c = planet.color

  const nameStyle = {
    color: `${c}cc`,
    fontSize: planet.isMobile ? '0.5rem' : '0.42rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 300,
  }
  const descStyle = {
    color: 'rgba(255,255,255,0.25)',
    fontSize: planet.isMobile ? '0.42rem' : '0.36rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    marginTop: '0.28rem',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 300,
  }
  const lineH = { background: `${c}40`, height: 1, flexShrink: 0 }
  const lineV = { background: `${c}40`, width: 1, flexShrink: 0 }

  let inner
  if (side === 'below' || side === 'above') {
    inner = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {side === 'below' && <div style={{ ...lineV, height: 16, marginBottom: 8 }} />}
        <div style={{ textAlign: 'center' }}>
          <div style={nameStyle}>{planet.name}</div>
          <div style={descStyle}>{planet.description}</div>
        </div>
        {side === 'above' && <div style={{ ...lineV, height: 16, marginTop: 8 }} />}
      </div>
    )
  } else if (side === 'left') {
    inner = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={nameStyle}>{planet.name}</div>
          <div style={descStyle}>{planet.description}</div>
        </div>
        <div style={{ ...lineH, width: 20, alignSelf: 'flex-start', marginTop: 8 }} />
      </div>
    )
  } else {
    // right
    inner = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ ...lineH, width: 20, alignSelf: 'flex-start', marginTop: 8 }} />
        <div>
          <div style={nameStyle}>{planet.name}</div>
          <div style={descStyle}>{planet.description}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity 0.4s ease' }}>
      {inner}
    </div>
  )
}

// ── PlanetHUDOverlay ──────────────────────────────────────────────────────
// Lives outside <Canvas>. Reads hudPosRef via RAF at ~30 fps and positions
// the HTML labels absolutely over the canvas. No WebGL involvement.
export function PlanetHUDOverlay({
  planets,
  hudPosRef,
  hoveredId,
  clickedId,
  loaded,
  isMobile,
}) {
  const [positions, setPositions] = useState({})

  useEffect(() => {
    let raf
    let lastTime = 0

    function tick(time) {
      // throttle to ~30 fps
      if (time - lastTime > 33) {
        lastTime = time
        const snap = hudPosRef.current
        if (snap && Object.keys(snap).length > 0) {
          setPositions((prev) => {
            const changed = planets.some((p) => {
              const np = snap[p.id]
              const pp = prev[p.id]
              if (!np || !pp) return true
              return Math.abs(np.x - pp.x) > 0.5 || Math.abs(np.y - pp.y) > 0.5
            })
            return changed ? { ...snap } : prev
          })
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [planets, hudPosRef])

  // Don't render until loading screen is fully gone
  if (!loaded) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 6,
        overflow: 'hidden',
      }}
    >
      {planets.map((planet) => {
        if (clickedId === planet.id) return null
        const pos = positions[planet.id]
        if (!pos) return null

        const side = planet.labelSide
        // Push label from planet center outward by ~planet-radius in pixels
        const offsetPx = isMobile ? 52 : 85
        const ox = side === 'right' ? offsetPx : side === 'left' ? -offsetPx : 0
        const oy = side === 'below' ? offsetPx : side === 'above' ? -offsetPx : 0

        // Anchor so the connector-end of the label touches the offset point
        const transform =
          side === 'left'  ? 'translate(-100%, -50%)' :
          side === 'right' ? 'translateY(-50%)'        :
          side === 'below' ? 'translateX(-50%)'        :
                             'translate(-50%, -100%)'

        return (
          <div
            key={planet.id}
            style={{
              position: 'absolute',
              left: pos.x + ox,
              top:  pos.y + oy,
              transform,
              animation: 'hudFadeIn 1.5s ease-out 0.3s forwards',
              opacity: 0,
              userSelect: 'none',
            }}
          >
            <PlanetHUDLabel
              planet={planet}
              side={side}
              dimmed={hoveredId !== null && hoveredId !== planet.id}
            />
          </div>
        )
      })}
    </div>
  )
}
