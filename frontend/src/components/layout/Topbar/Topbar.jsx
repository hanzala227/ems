import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, MessageSquare, Plus, Search, ChevronDown,
  LogOut, Settings, User, Menu, X,
} from 'lucide-react'
import { logoutUser } from '../../../app/slices/authSlice'
import { toggleSidebar } from '../../../app/slices/uiSlice'
import NotificationPanel from '../../notifications/NotificationPanel'
import styles from './Topbar.module.css'

// Map route segments to readable page names
function getPageTitle(pathname, role) {
  const segments = pathname.split('/').filter(Boolean)
  const page = segments[segments.length - 1] || 'dashboard'
  const map = {
    dashboard: 'Dashboard',
    expos: 'Expos',
    create: 'Create Expo',
    exhibitors: 'Exhibitors',
    attendees: 'Attendees',
    sessions: 'Sessions',
    schedule: 'Schedule',
    'floor-plan': 'Floor Plan',
    applications: 'Applications',
    messages: 'Messages',
    notifications: 'Notifications',
    settings: 'Settings',
    reports: 'Reports',
    profile: 'Profile',
  }
  return map[page] || page.charAt(0).toUpperCase() + page.slice(1)
}

export default function Topbar() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const location   = useLocation()
  const user       = useSelector((s) => s.auth.user)
  const msgCount   = useSelector((s) => s.messages.unreadCount)
  const notifCount = useSelector((s) => s.notifications.unreadCount)
  const collapsed  = useSelector((s) => s.ui.sidebarCollapsed)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)

  const handleLogout = async () => {
    setDropdownOpen(false)
    await dispatch(logoutUser())
    navigate('/login', { replace: true })
  }

  const dashboardBase = `/${user?.role || 'organizer'}`
  const pageTitle = getPageTitle(location.pathname, user?.role)

  // Handle search submit — navigates to expo list with search query
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    const role = user?.role || 'organizer'
    // Navigate to the expos listing page with search param
    navigate(`/${role}/expos?search=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery('')
    searchRef.current?.blur()
  }

  // Keyboard shortcut ⌘K / Ctrl+K to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur()
        setSearchFocused(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <header className={styles.topbar}>

      {/* ── Left: hamburger + page title ─────────────────────── */}
      <div className={styles.left}>
        <button
          className={styles.hamburger}
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className={styles.greeting}>
          <span className={styles.greetText}>{pageTitle}</span>
          <span className={styles.greetSub}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Center: search ─────────────────────────────────── */}
      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} />
        <input
          ref={searchRef}
          className={styles.search}
          placeholder="Search expos, exhibitors, booths..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        />
        {searchQuery ? (
          <button
            className={styles.clearBtn}
            onClick={() => { setSearchQuery(''); searchRef.current?.focus() }}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        ) : (
          <span className={styles.shortcut}>⌘K</span>
        )}
      </div>

      {/* ── Right: actions ─────────────────────────────────── */}
      <div className={styles.right}>

        {/* Create Expo CTA — organizer only */}
        {user?.role === 'organizer' && (
          <Link to="/organizer/expos/create" className={styles.createBtn}>
            <Plus size={15} strokeWidth={2.5} />
            <span>New Expo</span>
          </Link>
        )}

        {/* Notification bell */}
        <div className={styles.iconWrap}>
          <button
            className={styles.iconBtn}
            onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false) }}
            aria-label="Notifications"
          >
            <Bell size={17} />
            <AnimatePresence>
              {notifCount > 0 && (
                <motion.span
                  className={styles.dot}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {notifCount > 9 ? '9+' : notifCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <AnimatePresence>
            {notifOpen && (
              <NotificationPanel onClose={() => setNotifOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <div className={styles.iconWrap}>
          <Link
            to={`${dashboardBase}/messages`}
            className={styles.iconBtn}
            aria-label="Messages"
            onClick={() => setNotifOpen(false)}
          >
            <MessageSquare size={17} />
            <AnimatePresence>
              {msgCount > 0 && (
                <motion.span
                  className={styles.dot}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {msgCount > 9 ? '9+' : msgCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* User avatar + dropdown */}
        <div className={styles.avatarWrap}>
          <button
            className={styles.avatarBtn}
            onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false) }}
            aria-label="User menu"
          >
            <div className={styles.avatarInner}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className={styles.avatar} />
                : (
                  <span className={styles.avatarFallback}>
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                )
              }
            </div>
            <ChevronDown
              size={13}
              className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className={styles.dropdown}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                {/* User info */}
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownAvatar}>
                    {user?.avatar
                      ? <img src={user.avatar} alt="" />
                      : user?.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className={styles.dropdownInfo}>
                    <p className={styles.dropdownName}>{user?.name}</p>
                    <p className={styles.dropdownEmail}>{user?.email}</p>
                  </div>
                </div>

                <div className={styles.dropdownRole}>
                  <span className={styles.rolePill}>{user?.role}</span>
                </div>

                <hr className={styles.dropdownDivider} />

                <Link
                  to={`${dashboardBase}/settings`}
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings size={14} /> Settings
                </Link>

                {(user?.role === 'exhibitor') && (
                  <Link
                    to="/exhibitor/profile"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={14} /> My Profile
                  </Link>
                )}

                {(user?.role === 'attendee') && (
                  <Link
                    to="/attendee/profile"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={14} /> My Profile
                  </Link>
                )}

                <hr className={styles.dropdownDivider} />

                <button
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
