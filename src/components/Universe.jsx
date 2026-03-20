'use client'

import { Canvas } from '@react-three/fiber'
import { Stars, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Planet from './Planet'
import CameraController from './CameraController'
import LoadingScreen from './LoadingScreen'
import Cursor from './Cursor'
import Nebula from './Nebula'
import { ScreenPositionTracker, PlanetHUDOverlay } from './PlanetHUD'

// ── Translations ────────────────────────────────────────────────────────────
const T = {
  en: {
    subtitle:    'Welcome to my universe',
    hintDesktop: 'move to explore · click to enter',
    hintMobile:  'scroll to explore · tap to enter',
    ctaDesktop:  'click to explore →',
    ctaMobile:   'tap to explore →',
    entering:    (name) => `entering ${name}`,
  },
  es: {
    subtitle:    'Bienvenido a mi universo',
    hintDesktop: 'muévete para explorar · haz clic para entrar',
    hintMobile:  'desliza para explorar · toca para entrar',
    ctaDesktop:  'haz clic para explorar →',
    ctaMobile:   'toca para explorar →',
    entering:    (name) => `entrando a ${name}`,
  },
}

// ── Planet definitions ────────────────────────────────────────────────────
const PLANET_DEFS = [
  // 1 — Music  (desktop: left | mobile: top)
  {
    id: 'music',
    name: { en: 'Music', es: 'Música' },
    radius: 1.4,       mobileRadius: 1.0,
    color: '#a855f7',
    emissive: '#7c3aed',
    hasRings: false,
    ringColor: null,
    url: 'https://music.robertino.world',
    description: { en: 'Sounds & Vibes', es: 'Sonidos & Vibras' },
    texture: '/images/planet-music.jpg',
    desktopPos: [-5.5, 0, 0],
    mobilePos:  [0,  3.8, 0],
    desktopLabelSide: 'left',
    mobileLabelSide:  'right',
    coords: { sector: 'Ω-7', dist: '4.2 AU', freq: '432 Hz' },
  },
  // 2 — Ideas  (desktop: center | mobile: middle)
  {
    id: 'ideas',
    name: { en: 'Ideas', es: 'Ideas' },
    radius: 1.2,       mobileRadius: 0.9,
    color: '#06b6d4',
    emissive: '#0891b2',
    hasRings: false,
    ringColor: null,
    url: 'https://robertinotalk.robertino.world',
    description: { en: 'Thoughts & Talk', es: 'Pensamientos & Charlas' },
    texture: '/images/planet-ideas.jpg?v=2',
    desktopPos: [0, 0, 0],
    mobilePos:  [0, 1.5, 0],
    desktopLabelSide: 'below',
    mobileLabelSide:  'left',
    coords: { sector: 'Δ-3', dist: '7.1 AU', freq: '528 Hz' },
  },
  // 3 — Professional  (desktop: right | mobile: bottom)
  {
    id: 'professional',
    name: { en: 'Professional', es: 'Profesional' },
    radius: 1.3,       mobileRadius: 0.95,
    color: '#f59e0b',
    emissive: '#d97706',
    hasRings: false,
    ringColor: null,
    url: 'https://resume.robertino.world',
    description: { en: 'Work & Journey', es: 'Trabajo & Trayectoria' },
    texture: '/images/planet-professional.jpg',
    desktopPos: [5.5, 0, 0],
    mobilePos:  [0, -0.3, 0],
    desktopLabelSide: 'right',
    mobileLabelSide:  'right',
    coords: { sector: 'Σ-9', dist: '2.8 AU', signal: 'Active' },
  },
]

export default function Universe() {
  const hudPosRef = useRef({})

  const [loaded,        setLoaded]        = useState(false)
  const [hoveredPlanet, setHoveredPlanet] = useState(null)
  const [clickedPlanet, setClickedPlanet] = useState(null)
  const [warping,       setWarping]       = useState(false)
  const [warpColor,     setWarpColor]     = useState('#ffffff')
  const [isMobile,      setIsMobile]      = useState(false)
  const [lang,          setLang]          = useState('en')

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Inject correct position + localised strings + label side
  const planets = useMemo(() =>
    PLANET_DEFS.map((p) => ({
      ...p,
      position:    isMobile ? p.mobilePos : p.desktopPos,
      radius:      isMobile ? p.mobileRadius : p.radius,
      name:        p.name[lang],
      description: p.description[lang],
      labelSide:   isMobile ? p.mobileLabelSide : p.desktopLabelSide,
      isMobile,
    })),
    [isMobile, lang]
  )

  const handlePlanetClick = useCallback((planet) => {
    if (clickedPlanet || warping) return
    setClickedPlanet(planet)
    setWarpColor(planet.color)
    setTimeout(() => setWarping(true), 850)
    setTimeout(() => {
      // Mobile browsers block window.open() inside setTimeout (popup blocker).
      // Use location.href on mobile — always allowed, even deferred.
      if (isMobile) {
        window.location.href = planet.url
      } else {
        window.open(planet.url, '_blank')
      }
    }, 1700)
    setTimeout(() => { setClickedPlanet(null); setWarping(false) }, 2500)
  }, [clickedPlanet, warping, isMobile])

  const t   = T[lang]
  const cta = isMobile ? t.ctaMobile : t.ctaDesktop

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020408' }}>

      <LoadingScreen onComplete={() => setLoaded(true)} />
      {!isMobile && <Cursor hoveredPlanet={hoveredPlanet} />}

      {/* ── 3D Scene ── */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 58 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ background: '#020408' }}
      >
        <fog attach="fog" args={['#020408', 28, 95]} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <pointLight position={[-13, 4, 2]}  intensity={1.3} color="#a855f7" />
        <pointLight position={[13, -4, 2]}  intensity={1.0} color="#06b6d4" />
        <pointLight position={[0,   9, -6]} intensity={0.8} color="#f59e0b" />
        <Stars radius={220} depth={100} count={6000} factor={3.5} saturation={0.1} fade speed={0.3} />
        <Nebula />
        {planets.map((planet) => (
          <Planet
            key={planet.id}
            data={planet}
            isClicked={clickedPlanet?.id === planet.id}
            onHover={setHoveredPlanet}
            onClick={handlePlanetClick}
          />
        ))}
        <CameraController target={clickedPlanet} isMobile={isMobile} />
        <ScreenPositionTracker planets={planets} hudPosRef={hudPosRef} />
        <EffectComposer>
          <Bloom intensity={2.8} luminanceThreshold={0.04} luminanceSmoothing={0.9} radius={0.92} />
          <Vignette eskil={false} offset={0.14} darkness={0.95} />
        </EffectComposer>
        <AdaptiveDpr pixelSizes={[0.5, 0.75, 1]} />
      </Canvas>

      {/* ── HUD Planet Labels (01) ── */}
      <PlanetHUDOverlay
        planets={planets}
        hudPosRef={hudPosRef}
        hoveredId={hoveredPlanet?.id ?? null}
        clickedId={clickedPlanet?.id ?? null}
        loaded={loaded}
        isMobile={isMobile}
      />

      {/* ── Noise / film grain overlay (05) ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          opacity: 0.04,
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65 0.9"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* ── HUD overlay ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>

        {/* ── Language toggle — top-right ── */}
        <AnimatePresence>
          {loaded && (
            <motion.div
              key="lang"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1 }}
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                pointerEvents: 'auto',
              }}
            >
              {['en', 'es'].map((l) => (
                <motion.button
                  key={l}
                  onClick={() => setLang(l)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'none',
                    padding: '0.25rem 0.1rem',
                    fontSize: '0.6rem',
                    fontFamily: 'inherit',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: lang === l
                      ? 'rgba(255,255,255,0.88)'
                      : 'rgba(255,255,255,0.28)',
                    borderBottom: lang === l
                      ? '1px solid rgba(255,255,255,0.5)'
                      : '1px solid transparent',
                    transition: 'color 0.3s, border-color 0.3s',
                  }}
                >
                  {l}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Title ── */}
        <AnimatePresence>
          {loaded && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.8, delay: 0.4, ease: [0.1, 0, 0.2, 1] }}
              style={{
                position: 'absolute',
                top: '2.2rem',
                left: 0,
                right: 0,
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: isMobile ? '0.78rem' : '1.12rem',
                  fontWeight: 300,
                  letterSpacing: isMobile ? '0.3em' : '0.55em',
                  textTransform: 'uppercase',
                  margin: '0 auto',
                  paddingLeft: isMobile ? '0.3em' : '0.55em',
                }}
              >
                robertino.world
              </h1>
              <AnimatePresence mode="wait">
                <motion.p
                  key={lang + '-subtitle'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    color: 'rgba(255,255,255,0.26)',
                    fontSize: '0.58rem',
                    letterSpacing: isMobile ? '0.2em' : '0.38em',
                    textTransform: 'uppercase',
                    marginTop: '0.6rem',
                    paddingLeft: isMobile ? '0.2em' : '0.38em',
                  }}
                >
                  {t.subtitle}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Idle hint ── */}
        <AnimatePresence>
          {loaded && !hoveredPlanet && !clickedPlanet && (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 2.2 }}
              style={{
                position: 'absolute',
                bottom: '2.8rem',
                left: 0,
                right: 0,
                textAlign: 'center',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={lang + '-hint'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.22, 0.5, 0.22] }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.56rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    paddingLeft: '0.22em',
                  }}
                >
                  {isMobile ? t.hintMobile : t.hintDesktop}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Planet hover label ── */}
        <AnimatePresence>
          {hoveredPlanet && !clickedPlanet && (
            <motion.div
              key={hoveredPlanet.id + lang}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                bottom: '3rem',
                left: 0,
                right: 0,
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 30 }}
                exit={{ width: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  height: 1,
                  background: hoveredPlanet.color,
                  margin: '0 auto 1rem',
                  boxShadow: `0 0 10px ${hoveredPlanet.color}`,
                }}
              />
              <h2
                style={{
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: isMobile ? '1.1rem' : '1.45rem',
                  fontWeight: 300,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  margin: 0,
                  paddingLeft: '0.32em',
                }}
              >
                {hoveredPlanet.name}
              </h2>
              <p
                style={{
                  color: 'rgba(255,255,255,0.38)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginTop: '0.5rem',
                  paddingLeft: '0.22em',
                }}
              >
                {hoveredPlanet.description}
              </p>

              {/* ── Coordinate readout (04) ── */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.6rem',
                  justifyContent: 'center',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: `1px solid ${hoveredPlanet.color}1a`,
                }}
              >
                {Object.entries(hoveredPlanet.coords).map(([key, val]) => (
                  <div key={key}>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.18)',
                        fontSize: '0.36rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {key}
                    </div>
                    <div
                      style={{
                        color: `${hoveredPlanet.color}cc`,
                        fontSize: '0.48rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              <motion.p
                animate={{ opacity: [0.35, 0.75, 0.35] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{
                  color: hoveredPlanet.color,
                  fontSize: '0.56rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  marginTop: '0.9rem',
                  paddingLeft: '0.25em',
                  textShadow: `0 0 10px ${hoveredPlanet.color}`,
                }}
              >
                {cta}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Warp burst ── */}
        <AnimatePresence>
          {warping && (
            <motion.div
              key="warp"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 32, opacity: 0 }}
                transition={{ duration: 1.1, ease: [0.08, 0, 0.55, 1] }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${warpColor}ee 0%, ${warpColor}66 40%, transparent 72%)`,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Entering text ── */}
        <AnimatePresence>
          {clickedPlanet && (
            <motion.div
              key="entering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              style={{
                position: 'absolute',
                bottom: '3.2rem',
                left: 0,
                right: 0,
                textAlign: 'center',
              }}
            >
              <motion.p
                initial={{ letterSpacing: '0.08em', opacity: 0 }}
                animate={{ letterSpacing: '0.42em', opacity: 0.72 }}
                transition={{ duration: 0.9, delay: 0.65 }}
                style={{
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '0.62rem',
                  textTransform: 'uppercase',
                  paddingLeft: '0.42em',
                }}
              >
                {t.entering(clickedPlanet.name)}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
