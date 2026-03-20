'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoadingScreen({ onComplete }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3400)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          key="loader"
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#020408',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          {/* Main title — letter-spacing expands on mount */}
          <motion.h1
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.55em' }}
            transition={{ duration: 2.0, ease: [0.1, 0, 0.2, 1] }}
            style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: '1.15rem',
              fontWeight: 300,
              textTransform: 'uppercase',
              paddingLeft: '0.55em', /* compensate letterSpacing so text is centered */
            }}
          >
            robertino.world
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 1.0, duration: 1.2 }}
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.58rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              marginTop: '1rem',
              paddingLeft: '0.4em',
            }}
          >
            initializing universe
          </motion.p>

          {/* Three pulsing dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{ display: 'flex', gap: '8px', marginTop: '3.5rem' }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.55)',
                }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
