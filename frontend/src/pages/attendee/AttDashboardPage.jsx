import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import CountUpLib from 'react-countup'
const CountUp = CountUpLib.default ?? CountUpLib
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CalendarDays, Clock, Bell, MessageSquare,
  Search, Bookmark, User, Layout, Activity
} from 'lucide-react'
import { listMyRegistrations } from '../../api/registration.api'
import { listMyBookings } from '../../api/booking.api'
import Badge from '../../components/ui/Badge/Badge'
import FloorPlanPreview from '../../components/ui/FloorPlanPreview/FloorPlanPreview'
import styles from './AttDashboardPage.module.css'

function StatsWidget({ regsCount, booksCount, msgCount, notifCount }) {
  const STAT_CONFIG = [
    { key: 'expos',    label: 'Registered Expos', icon: CalendarDays,  value: regsCount,  color: '#7c5cbf' },
    { key: 'bookings', label: 'Booked Sessions',  icon: Clock,         value: booksCount, color: '#22c55e' },
    { key: 'messages', label: 'Unread Messages',  icon: MessageSquare, value: msgCount,   color: '#3b82f6' },
    { key: 'notifs',   label: 'Notifications',    icon: Bell,          value: notifCount, color: '#f59e0b' },
  ]

  return (
    <div className={styles.statsGrid}>
      {STAT_CONFIG.map((stat, i) => (
        <motion.div
          key={stat.key}
          className={styles.statCard}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 + 0.1 }}
        >
          <div className={styles.statTop}>
            <span className={styles.statLabel}>{stat.label}</span>
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
          </div>
          <div className={styles.statValue}>
            <CountUp end={stat.value} duration={1.5} separator="," />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function AttDashboardPage() {
  const user = useSelector(s => s.auth.user)
  const msgCount = useSelector(s => s.messages.unreadCount)
  const notifCount = useSelector(s => s.notifications.unreadCount)
  const navigate = useNavigate()

  const { data: regsData, isLoading: regsLoading } = useQuery({
    queryKey: ['registrations', 'my'],
    queryFn: () => listMyRegistrations().then(r => r.data.data),
  })

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => listMyBookings().then(r => r.data.data),
  })

  const registrations = regsData?.registrations || []
  const bookings = booksData?.bookings || []
  const upcomingBookings = bookings.filter(b => b.sessionId && new Date(b.sessionId.endTime) > new Date()).slice(0, 3)
  const activeReg = registrations.find(r => r.expoId?.status === 'Published' || r.expoId?.status === 'Live')
  const floorPlanExpoId = activeReg?.expoId?._id || registrations[0]?.expoId?._id

  return (
    <div className={styles.page}>
      
      {/* ── Page title row ────────────────────────────────────── */}
      <motion.div
        className={styles.greeting}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div>
          <h1 className={styles.greetTitle}>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.greetSub}>
            Discover and attend world-class expos.
          </p>
        </div>
        <Link to="/attendee/events" className={styles.createBtn}>
          <Search size={15} /> Browse Events
        </Link>
      </motion.div>

      {/* ── Stat cards ──────────────────────────────── */}
      <StatsWidget regsCount={registrations.length} booksCount={bookings.length} msgCount={msgCount} notifCount={notifCount} />

      {/* ── Main 3-column grid ──────── */}
      <div className={styles.mainGrid}>

        {/* ── Left column: Registered Expos ── */}
        <div className={styles.leftCol}>
          <div className={`${styles.applicationsCard} ${styles.flexCard}`}>
            <div className={styles.tableHeader}>
              <span className={styles.chartTitle}>My Registered Expos</span>
              <div className={styles.tableHeaderRight}>
                <Link to="/attendee/events" className={styles.viewAll}>
                  Browse More →
                </Link>
              </div>
            </div>
            
            {regsLoading ? <Skeleton count={4} height={40} style={{ marginBottom: 6 }} /> :
             !registrations.length ? (
              <div className={styles.emptyState}>
                <CalendarDays size={32} />
                <p>Not registered for any expos. <Link to="/attendee/events">Discover events →</Link></p>
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.slice(0, 5).map((reg) => (
                      <tr key={reg._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/attendee/events/${reg.expoId?._id}`)}>
                        <td>
                          <div className={styles.exhibitorCell}>
                            <div className={styles.exAvatar}>
                              {reg.expoId?.bannerImage ? <img src={reg.expoId.bannerImage} alt="" /> : reg.expoId?.name?.[0]}
                            </div>
                            <span className={styles.exName}>{reg.expoId?.name}</span>
                          </div>
                        </td>
                        <td className={styles.muted}>
                          {reg.expoId?.startDate && format(new Date(reg.expoId.startDate), 'MMM d, yyyy')}
                        </td>
                        <td><Badge variant={reg.expoId?.status?.toLowerCase()}>{reg.expoId?.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Middle column: Floor Plan Preview ── */}
        <div className={styles.middleCol}>
          <div className={styles.flexCard} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <FloorPlanPreview expoId={floorPlanExpoId} title="Event Floor Plan" userRole="attendee" />
          </div>
        </div>

        {/* ── Right column: Upcoming Sessions + Quick Actions ────── */}
        <div className={styles.rightCol}>

          {/* Upcoming Sessions */}
          <div className={`${styles.scheduleCard} ${styles.flexCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.chartTitle}>Upcoming Sessions</span>
              <Link to="/attendee/bookings" className={styles.viewAll}>All Bookings</Link>
            </div>
            {booksLoading ? <Skeleton count={3} height={52} style={{ marginBottom: 6 }} /> :
             !upcomingBookings.length ? (
              <div className={styles.emptyState} style={{ padding: '2rem 1rem' }}>
                <Clock size={28} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No upcoming sessions scheduled.</p>
              </div>
            ) : (
              <div className={styles.scheduleList}>
                {upcomingBookings.map(b => (
                  <div key={b._id} className={`${styles.scheduleItem} ${b.sessionId?.status === 'Live' ? styles.liveItem : ''}`}>
                    <div className={styles.scheduleTime}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                        {b.sessionId?.startTime && format(new Date(b.sessionId.startTime), 'MMM d')}
                      </span>
                      <span>{b.sessionId?.startTime && format(new Date(b.sessionId.startTime), 'h:mm a')}</span>
                    </div>
                    <div className={styles.scheduleInfo}>
                      <span className={styles.scheduleTitle}>{b.sessionId?.title}</span>
                      {b.sessionId?.stageId?.name && <span className={styles.scheduleStage}>{b.sessionId.stageId.name}</span>}
                    </div>
                    <Badge variant={b.sessionId?.status?.toLowerCase()}>{b.sessionId?.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`${styles.quickActionsCard} ${styles.flexCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.chartTitle}>Quick Actions</span>
            </div>
            <div className={styles.quickGrid}>
              {[
                { icon: Search,        label: 'Browse Events', action: () => navigate('/attendee/events'),        color: '#7c5cbf' },
                { icon: Bookmark,      label: 'My Bookings',   action: () => navigate('/attendee/bookings'),      color: '#22c55e' },
                { icon: Layout,        label: 'Floor Plans',   action: () => navigate('/attendee/events'),        color: '#3b82f6' },
                { icon: User,          label: 'My Profile',    action: () => navigate('/attendee/profile'),       color: '#f59e0b' },
                { icon: Bell,          label: 'Notifications', action: () => navigate('/attendee/notifications'), color: '#ef4444' },
                { icon: MessageSquare, label: 'Messages',      action: () => navigate('/attendee/messages'),      color: '#14b8a6' },
              ].map(({ icon: Icon, label, action, color }) => (
                <button key={label} className={styles.quickBtn} onClick={action}>
                  <Icon size={20} className={styles.quickIconOnly} style={{ color }} />
                  <span className={styles.quickLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  )
}
