import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuth()
  const dashboardLink = isAuthenticated && user ? `/${user.role}` : '/login'

  return (
    <div className={styles.root}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.subtitle}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to={dashboardLink} className={styles.btn}>
          {isAuthenticated ? '← Back to Dashboard' : '← Back to Login'}
        </Link>
      </motion.div>
    </div>
  )
}
