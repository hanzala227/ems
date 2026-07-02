import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.root}>
      {/* Animated background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Grid pattern overlay */}
      <div className={styles.grid} />

      {/* Card */}
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top glow line */}
        <div className={styles.glowLine} />

        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="#7c5cbf" strokeWidth="1.5" fill="none"/>
              <circle cx="14" cy="14" r="6.5" stroke="#9b74d4" strokeWidth="1.2" fill="none"/>
              <circle cx="14" cy="14" r="2.5" fill="url(#g)" />
              <defs>
                <radialGradient id="g" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#9b74d4"/>
                  <stop offset="100%" stopColor="#7c5cbf"/>
                </radialGradient>
              </defs>
              <line x1="14" y1="3" x2="14" y2="6.5" stroke="#7c5cbf" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="14" y1="21.5" x2="14" y2="25" stroke="#7c5cbf" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="3" y1="14" x2="6.5" y2="14" stroke="#7c5cbf" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="21.5" y1="14" x2="25" y2="14" stroke="#7c5cbf" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className={styles.logoText}>EventSphere</span>
        </div>

        <Outlet />
      </motion.div>
    </div>
  )
}
