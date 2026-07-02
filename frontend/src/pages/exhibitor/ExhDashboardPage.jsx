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
  CalendarDays, FileText, MapPin, MessageSquare, Bell,
  Plus, Search, Store, Layout, Clock, Activity, ArrowRight
} from 'lucide-react'
import { listMyApplications } from '../../api/application.api'
import { listPublicExpos } from '../../api/expo.api'
import Badge from '../../components/ui/Badge/Badge'
import FloorPlanPreview from '../../components/ui/FloorPlanPreview/FloorPlanPreview'
import styles from './ExhDashboardPage.module.css'

function StatsWidget({ appsCount, approvedCount, pendingCount, msgCount }) {
  const STAT_CONFIG = [
    { key: 'totalApps', label: 'Total Applications', icon: FileText,      value: appsCount,     color: '#7c5cbf' },
    { key: 'approved',  label: 'Approved',           icon: CalendarDays,  value: approvedCount, color: '#22c55e' },
    { key: 'pending',   label: 'Pending',            icon: MapPin,        value: pendingCount,  color: '#f59e0b' },
    { key: 'messages',  label: 'Unread Messages',    icon: MessageSquare, value: msgCount,      color: '#3b82f6' },
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

export default function ExhDashboardPage() {
  const user = useSelector(s => s.auth.user)
  const msgCount = useSelector(s => s.messages.unreadCount)
  const notifCount = useSelector(s => s.notifications.unreadCount)
  const navigate = useNavigate()

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', 'my'],
    queryFn: () => listMyApplications().then(r => r.data.data),
  })

  const { data: exposData } = useQuery({
    queryKey: ['expos', 'public', { limit: 4 }],
    queryFn: () => listPublicExpos({ limit: 4 }).then(r => r.data.data),
  })

  const apps = appsData?.applications || []
  const approved = apps.filter(a => a.status === 'approved').length
  const pending  = apps.filter(a => a.status === 'pending').length
  const upcomingExpos = exposData?.expos || []
  const approvedApp = apps.find(a => a.status === 'approved')
  const floorPlanExpoId = approvedApp?.expoId?._id || apps[0]?.expoId?._id

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
          <h1 className={styles.greetTitle}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.greetSub}>
            Manage your expo applications and booths.
          </p>
        </div>
        <Link to="/exhibitor/expos" className={styles.createBtn}>
          <Search size={15} /> Browse Expos
        </Link>
      </motion.div>

      {/* ── Stat cards ──────────────────────────────── */}
      <StatsWidget appsCount={apps.length} approvedCount={approved} pendingCount={pending} msgCount={msgCount} />

      {/* ── Main 3-column grid ──────── */}
      <div className={styles.mainGrid}>

        {/* ── Left column: Recent Applications ── */}
        <div className={styles.leftCol}>
          <div className={`${styles.applicationsCard} ${styles.flexCard}`}>
            <div className={styles.tableHeader}>
              <span className={styles.chartTitle}>Recent Applications</span>
              <div className={styles.tableHeaderRight}>
                <Link to="/exhibitor/applications" className={styles.viewAll}>
                  View All →
                </Link>
              </div>
            </div>
            
            {appsLoading ? <Skeleton count={4} height={40} style={{ marginBottom: 6 }} /> :
             !apps.length ? (
              <div className={styles.emptyState}>
                <FileText size={32} />
                <p>No applications yet. <Link to="/exhibitor/expos">Browse expos →</Link></p>
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Expo</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.slice(0, 5).map((app) => (
                      <tr key={app._id}>
                        <td>
                          <div className={styles.exhibitorCell}>
                            <div className={styles.exAvatar}>
                              {app.expoId?.bannerImage ? <img src={app.expoId.bannerImage} alt="" /> : app.expoId?.name[0]}
                            </div>
                            <span className={styles.exName}>{app.expoId?.name || 'Expo'}</span>
                          </div>
                        </td>
                        <td className={styles.muted}>{format(new Date(app.appliedAt), 'MMM d, yyyy')}</td>
                        <td><Badge variant={app.status}>{app.status}</Badge></td>
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
            <FloorPlanPreview expoId={floorPlanExpoId} title="Expo Floor Plan" userRole="exhibitor" />
          </div>
        </div>

        {/* ── Right column: Upcoming Expos + Quick Actions ────── */}
        <div className={styles.rightCol}>

          {/* Upcoming Expos */}
          <div className={`${styles.upcomingCard} ${styles.flexCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.chartTitle}>Upcoming Expos</span>
              <Link to="/exhibitor/expos" className={styles.viewAll}>Browse All</Link>
            </div>
            {!upcomingExpos.length ? (
              <div className={styles.emptyState}>
                <CalendarDays size={28} />
                <p>No upcoming expos found.</p>
              </div>
            ) : (
              <div className={styles.eventList}>
                {upcomingExpos.map((expo) => (
                  <Link key={expo._id} to={`/exhibitor/expos`} className={styles.eventItem}>
                    <div className={styles.eventImg}>
                      {expo.bannerImage
                        ? <img src={expo.bannerImage} alt={expo.name} />
                        : <CalendarDays size={16} />
                      }
                    </div>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventName}>{expo.name}</span>
                      <span className={styles.eventDate}>
                        {format(new Date(expo.startDate), 'MMM d')} – {format(new Date(expo.endDate), 'MMM d, yyyy')}
                      </span>
                      {expo.location?.city && (
                        <span className={styles.eventLoc}>{expo.location.city}, {expo.location.country}</span>
                      )}
                    </div>
                    <Badge variant={expo.status.toLowerCase()}>{expo.status}</Badge>
                  </Link>
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
                { icon: Search,        label: 'Browse Expos',  action: () => navigate('/exhibitor/expos'),        color: '#7c5cbf' },
                { icon: Store,         label: 'My Booths',     action: () => navigate('/exhibitor/my-booth'),     color: '#22c55e' },
                { icon: FileText,      label: 'Applications',  action: () => navigate('/exhibitor/applications'), color: '#3b82f6' },
                { icon: Layout,        label: 'Floor Plans',   action: () => navigate('/exhibitor/floor-plan'),   color: '#f59e0b' },
                { icon: Bell,          label: 'Notifications', action: () => navigate('/exhibitor/notifications'),color: '#ef4444' },
                { icon: MessageSquare, label: 'Messages',      action: () => navigate('/exhibitor/messages'),     color: '#14b8a6' },
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
