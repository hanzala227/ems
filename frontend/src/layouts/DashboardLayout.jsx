import { Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/layout/Sidebar/Sidebar'
import Topbar from '../components/layout/Topbar/Topbar'
import useNotifications from '../hooks/useNotifications'
import useMessages from '../hooks/useMessages'
import useSocket from '../hooks/useSocket'
import styles from './DashboardLayout.module.css'

// Wire all real-time listeners inside an authenticated layout
function RealTimeListeners() {
  useSocket()          // establish connection
  useNotifications()   // listen for notification:new
  useMessages()        // listen for message:receive
  return null
}

export default function DashboardLayout() {
  const sidebarCollapsed = useSelector((s) => s.ui.sidebarCollapsed)
  const location = useLocation()

  return (
    <div className={styles.root}>
      <RealTimeListeners />
      <Sidebar />
      <div className={`${styles.main} ${sidebarCollapsed ? styles.mainCollapsed : ''}`}>
        <Topbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className={styles.content}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
