import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CalendarDays, Clock, Users,
  BarChart2, FileText, MessageSquare, Bell, Settings,
  UserCog, Star, ChevronLeft, Store, Map, Layout,
  Activity, Plug, TrendingUp,
  BookOpen, Layers, ClipboardList,
} from 'lucide-react'
import { toggleSidebar } from '../../../app/slices/uiSlice'
import { logoutUser } from '../../../app/slices/authSlice'
import styles from './Sidebar.module.css'

// ─── Organizer nav ─────────────────────────────────────────────
const orgNav = [
  { section: 'MAIN', items: [
    { to: '/organizer',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    { to: '/organizer/expos',        label: 'My Expos',     icon: CalendarDays },
    { to: '/organizer/exhibitors',   label: 'Exhibitors',   icon: Users },
    { to: '/organizer/floor-plan',   label: 'Floor Plan',   icon: Layout },
    { to: '/organizer/attendees',    label: 'Attendees',    icon: TrendingUp },
    { to: '/organizer/analytics',    label: 'Analytics',    icon: BarChart2 },
    { to: '/organizer/reports',      label: 'Reports',      icon: FileText },
  ]},
  { section: 'EXPO TOOLS', items: [
    { label: 'Schedule',          icon: Clock,         dynamic: 'schedule' },
    { label: 'Applications',      icon: ClipboardList, dynamic: 'applications' },
  ]},
  { section: 'COMMUNICATION', items: [
    { to: '/organizer/messages',      label: 'Messages',      icon: MessageSquare, badge: 'messages' },
    { to: '/organizer/notifications', label: 'Notifications', icon: Bell,          badge: 'notifications' },
    { to: '/organizer/feedback',      label: 'Feedback',      icon: Activity },
  ]},
  { section: 'SETTINGS', items: [
    { to: '/organizer/settings',      label: 'Settings',      icon: Settings },
    { to: '/organizer/users-roles',   label: 'Users & Roles', icon: UserCog },
    { to: '/organizer/integrations',  label: 'Integrations',  icon: Plug },
  ]},
]

// ─── Exhibitor nav ─────────────────────────────────────────────
const exhNav = [
  { section: 'MAIN', items: [
    { to: '/exhibitor',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    { to: '/exhibitor/expos',        label: 'Browse Expos', icon: CalendarDays },
    { to: '/exhibitor/applications', label: 'Applications', icon: FileText },
    { to: '/exhibitor/my-booth',     label: 'My Booth',     icon: Store },
  ]},
  { section: 'EXPO TOOLS', items: [
    { label: 'Floor Plan View',  icon: Map,     dynamic: 'exh-floorplan' },
    { label: 'Booth Selection',  icon: Layers,  dynamic: 'exh-booth-selection' },
  ]},
  { section: 'ACCOUNT', items: [
    { to: '/exhibitor/profile', label: 'Profile', icon: UserCog },
  ]},
  { section: 'COMMUNICATION', items: [
    { to: '/exhibitor/messages',      label: 'Messages',      icon: MessageSquare, badge: 'messages' },
    { to: '/exhibitor/notifications', label: 'Notifications', icon: Bell,          badge: 'notifications' },
  ]},
  { section: 'SETTINGS', items: [
    { to: '/exhibitor/settings', label: 'Settings', icon: Settings },
  ]},
]

// ─── Attendee nav ──────────────────────────────────────────────
const attNav = [
  { section: 'MAIN', items: [
    { to: '/attendee',              label: 'Dashboard',     icon: LayoutDashboard, exact: true },
    { to: '/attendee/events',       label: 'Browse Events', icon: CalendarDays },
    { to: '/attendee/bookings',     label: 'My Bookings',   icon: BookOpen },
    { to: '/attendee/schedule',     label: 'My Schedule',   icon: Clock },
    { to: '/attendee/floor-plan',   label: 'Floor Plan',    icon: Map },
  ]},
  { section: 'ACCOUNT', items: [
    { to: '/attendee/profile', label: 'Profile', icon: UserCog },
  ]},
  { section: 'COMMUNICATION', items: [
    { to: '/attendee/messages',      label: 'Messages',      icon: MessageSquare, badge: 'messages' },
    { to: '/attendee/notifications', label: 'Notifications', icon: Bell,          badge: 'notifications' },
  ]},
  { section: 'SETTINGS', items: [
    { to: '/attendee/settings', label: 'Settings', icon: Settings },
  ]},
]

const navByRole = { organizer: orgNav, exhibitor: exhNav, attendee: attNav }

export default function Sidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed)
  const user = useSelector((s) => s.auth.user)
  const msgCount   = useSelector((s) => s.messages.unreadCount)
  const notifCount = useSelector((s) => s.notifications.unreadCount)

  // Extract active expoId from URL (organizer context: /organizer/expos/:id/...)
  const expoIdMatch = location.pathname.match(/\/organizer\/expos\/([a-f0-9]{24})/)
  const activeExpoId = expoIdMatch?.[1] || null

  // Exhibitor booth-selection context
  const exhExpoMatch = location.pathname.match(/\/exhibitor\/booth-selection\/([a-f0-9]{24})/)
  const exhExpoId = exhExpoMatch?.[1] || null

  const navGroups = navByRole[user?.role] || orgNav

  const getBadge = (key) => {
    if (key === 'messages') return msgCount
    if (key === 'notifications') return notifCount
    return 0
  }

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => navigate('/login'))
  }

  // Resolve dynamic link destination
  const resolveDynamicLink = (dynamic) => {
    switch (dynamic) {
      case 'floorplan':
        return activeExpoId
          ? `/organizer/expos/${activeExpoId}/floor-plan`
          : '/organizer/expos'
      case 'schedule':
        return activeExpoId
          ? `/organizer/expos/${activeExpoId}/schedule`
          : '/organizer/expos'
      case 'applications':
        return activeExpoId
          ? `/organizer/expos/${activeExpoId}/applications`
          : '/organizer/expos'
      case 'exh-floorplan':
        return '/exhibitor/floor-plan'
      case 'exh-booth-selection':
        return exhExpoId
          ? `/exhibitor/booth-selection/${exhExpoId}`
          : '/exhibitor/applications'
      default:
        return '/'
    }
  }

  // Is a dynamic item currently the active route?
  const isDynamicActive = (dynamic) => {
    switch (dynamic) {
      case 'floorplan':    return location.pathname.includes('/floor-plan')
      case 'schedule':     return location.pathname.includes('/schedule') && location.pathname.includes('/expos/')
      case 'applications': return location.pathname.includes('/applications') && location.pathname.includes('/expos/')
      case 'exh-floorplan': return location.pathname.includes('/floor-plan')
      case 'exh-booth-selection':
        return location.pathname.includes('/booth-selection')
      default: return false
    }
  }

  // Does this dynamic item need expo context (no ID extracted yet)?
  const needsContext = (dynamic) => {
    if (['floorplan', 'schedule', 'applications'].includes(dynamic)) return !activeExpoId
    if (['exh-booth-selection'].includes(dynamic)) return !exhExpoId
    return false
  }

  return (
    <motion.nav
      className={styles.sidebar}
      animate={{ width: collapsed ? 60 : 224 }}
      transition={{ type: 'tween', duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#7c5cbf" strokeWidth="2" fill="none"/>
            <circle cx="14" cy="14" r="7"  stroke="#9b74d4" strokeWidth="1.5" fill="none"/>
            <circle cx="14" cy="14" r="3"  fill="#7c5cbf"/>
          </svg>
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              className={styles.logoText}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              EventSphere
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <div className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.section} className={styles.section}>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  className={styles.sectionLabel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {group.section}
                </motion.span>
              )}
            </AnimatePresence>

            {group.items.map((item) => {
              const Icon = item.icon
              const badge = item.badge ? getBadge(item.badge) : 0

              // Dynamic items — expo-context-sensitive buttons
              if (item.dynamic) {
                const resolvedTo = resolveDynamicLink(item.dynamic)
                const isActive = isDynamicActive(item.dynamic)
                const missingCtx = needsContext(item.dynamic)
                return (
                  <button
                    key={item.label}
                    className={`${styles.item} ${isActive ? styles.active : ''} ${missingCtx ? styles.itemDimmed : ''}`}
                    onClick={() => navigate(resolvedTo)}
                    title={
                      collapsed
                        ? item.label
                        : missingCtx
                          ? `${item.label} — open an expo first`
                          : item.label
                    }
                  >
                    <span className={styles.icon}><Icon size={17} strokeWidth={1.8} /></span>
                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          className={styles.label}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.13 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                )
              }

              // Normal NavLink items
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `${styles.item} ${isActive ? styles.active : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles.icon}><Icon size={17} strokeWidth={1.8} /></span>
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        className={styles.label}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.13 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && badge > 0 && (
                    <motion.span
                      className={styles.badge}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      {badge > 99 ? '99+' : badge}
                    </motion.span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Go Premium card ───────────────────────────────── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            className={styles.premium}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.premiumTop}>
              <span className={styles.premiumIcon}><Star size={14} /></span>
              <div>
                <p className={styles.premiumTitle}>Go Premium</p>
                <p className={styles.premiumSub}>Unlock advanced features, custom domains, and priority support.</p>
              </div>
            </div>
            <button className={styles.premiumBtn}>Upgrade Now</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collapse toggle ───────────────────────────────── */}
      <button
        className={styles.collapseBtn}
        onClick={() => dispatch(toggleSidebar())}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.span
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.22 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={15} />
        </motion.span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              Collapse Sidebar
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.nav>
  )
}
