import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import CountUpLib from 'react-countup'
const CountUp = CountUpLib.default ?? CountUpLib
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CalendarDays, Users, TrendingUp, DollarSign, MapPin,
  ArrowUpRight, ArrowDownRight, Plus, BarChart2, Clock,
  UserPlus, Layout, ClipboardList, Bell, FileText,
  Mic2, CheckCircle, XCircle, Activity,
} from 'lucide-react'
import { getDashboardStats, getPerformanceChart } from '../../api/analytics.api'
import { listApplicationsByExpo } from '../../api/application.api'
import { listMyExpos } from '../../api/expo.api'
import { listSessionsByExpo } from '../../api/session.api'
import Badge from '../../components/ui/Badge/Badge'
import FloorPlanPreview from '../../components/ui/FloorPlanPreview/FloorPlanPreview'
import styles from './OrgDashboardPage.module.css'

const STAT_CONFIG = [
  { key: 'totalExpos',      label: 'Total Expos',      icon: CalendarDays, prefix: '',  color: '#7c5cbf', growthKey: 'expoGrowth' },
  { key: 'totalExhibitors', label: 'Total Exhibitors',  icon: Users,        prefix: '',  color: '#22c55e', growthKey: 'exhibitorGrowth' },
  { key: 'totalAttendees',  label: 'Total Attendees',   icon: TrendingUp,   prefix: '',  color: '#3b82f6', growthKey: 'attendeeGrowth' },
  { key: 'totalRevenue',    label: 'Total Revenue',     icon: DollarSign,   prefix: '$', color: '#f59e0b', growthKey: 'revenueGrowth' },
  { key: 'boothOccupancy',  label: 'Booth Occupancy',   icon: MapPin,       suffix: '%', color: '#14b8a6', growthKey: null },
]

// Today's Schedule sub-component — fetches sessions for most recent active expo
function TodaysSchedule({ expoId }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data, isLoading } = useQuery({
    queryKey: ['sessions', expoId, 'today'],
    queryFn: () => listSessionsByExpo(expoId, { date: today }).then(r => r.data.data),
    enabled: !!expoId,
  })

  let sessions = (data?.sessions || []).slice(0, 4)

  if (isLoading) return <Skeleton count={3} height={52} style={{ marginBottom: 6 }} />

  if (!sessions.length) {
    return (
      <div className={styles.emptyState} style={{ padding: '2rem 1rem' }}>
        <Clock size={28} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No sessions scheduled for today</p>
      </div>
    )
  }

  return (
    <div className={styles.scheduleList}>
      {sessions.map(s => (
        <div key={s._id} className={`${styles.scheduleItem} ${s.status === 'Live' ? styles.liveItem : ''}`}>
          <div className={styles.scheduleTime}>
            <span>{format(new Date(s.startTime), 'h:mm a')}</span>
          </div>
          <div className={styles.scheduleInfo}>
            <span className={styles.scheduleTitle}>{s.title}</span>
            {s.stageId?.name && <span className={styles.scheduleStage}>{s.stageId.name}</span>}
          </div>
          <Badge variant={s.status.toLowerCase()}>{s.status}</Badge>
        </div>
      ))}
    </div>
  )
}

export default function OrgDashboardPage() {
  const user = useSelector((s) => s.auth.user)
  const navigate = useNavigate()

  const { data: exposData } = useQuery({
    queryKey: ['expos', 'my'],
    queryFn: () => listMyExpos({ limit: 5 }).then(r => r.data.data),
  })

  const recentExpoId = exposData?.expos?.[0]?._id

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
          <h1 className={styles.greetTitle}>Dashboard Overview</h1>
          <p className={styles.greetSub}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Link to="/organizer/expos/create" className={styles.createBtn}>
          <Plus size={15} /> Create Expo
        </Link>
      </motion.div>

      {/* ── Stat cards (isolated) ──────────────────────────────── */}
      <StatsWidget />

      {/* ── Main 3-column grid ──────── */}
      <div className={styles.mainGrid}>

        {/* ── Left column: Performance Chart + Applications ── */}
        <div className={styles.leftCol}>

          {/* Performance Chart (isolated) */}
          <PerformanceChartWidget />

          {/* Applications table (isolated) */}
          <ExhibitorApplicationsWidget recentExpoId={recentExpoId} />
        </div>

        {/* ── Middle column: Floor Plan + Schedule ── */}
        <div className={styles.middleCol}>

          {/* Floor Plan Layout Preview */}
          <div className={styles.flexCard} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <FloorPlanPreview expoId={recentExpoId} title="Interactive Floor Plan" userRole="organizer" />
          </div>

          {/* Today's Schedule */}
          <div className={`${styles.scheduleCard} ${styles.flexCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.chartTitle}>Today's Schedule</span>
              {recentExpoId && (
                <Link to={`/organizer/expos/${recentExpoId}/schedule`} className={styles.viewAll}>
                  View Full Schedule →
                </Link>
              )}
            </div>
            {recentExpoId
              ? <TodaysSchedule expoId={recentExpoId} />
              : <div className={styles.emptySchedule}><Clock size={20} /><p>No active expos</p></div>
            }
          </div>

        </div>

        {/* ── Right column: Upcoming Events + Quick Actions + Engagement ────── */}
        <div className={styles.rightCol}>

          {/* Upcoming Events */}
          <div className={`${styles.upcomingCard} ${styles.flexCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.chartTitle}>Upcoming Events</span>
              <Link to="/organizer/expos" className={styles.viewAll}>View All</Link>
            </div>
            {!exposData?.expos?.length ? (
              <div className={styles.emptyState}>
                <CalendarDays size={28} />
                <p>No expos yet.</p>
              </div>
            ) : (
              <div className={styles.eventList}>
                {exposData.expos.slice(0, 3).map((expo) => (
                  <Link key={expo._id} to={`/organizer/expos/${expo._id}`} className={styles.eventItem}>
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
                    <Badge variant={expo.status.toLowerCase()}>{expo.status === 'published' ? 'Live' : 'Upcoming'}</Badge>
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
                { icon: Plus,          label: 'Create Expo',       action: () => navigate('/organizer/expos/create'),                          color: '#7c5cbf' },
                { icon: UserPlus,      label: 'Add Exhibitor',     action: () => navigate('/organizer/exhibitors'),                            color: '#22c55e' },
                { icon: Layout,        label: 'Assign Booth',      action: () => recentExpoId && navigate(`/organizer/expos/${recentExpoId}/floor-plan`), color: '#3b82f6' },
                { icon: ClipboardList, label: 'Add Session',       action: () => recentExpoId && navigate(`/organizer/expos/${recentExpoId}/schedule`),   color: '#f59e0b' },
                { icon: Bell,          label: 'Send Notification', action: () => navigate('/organizer/notifications'),                         color: '#ef4444' },
                { icon: FileText,      label: 'Generate Report',   action: () => navigate('/organizer/reports'),                               color: '#14b8a6' },
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

// ── Isolated Widget: Exhibitor Applications ──────────────────────────
// Own state for search/filter — typing here will NOT re-render the chart or other cards.
function ExhibitorApplicationsWidget({ recentExpoId }) {
  const [appTab, setAppTab] = useState('all')
  const [appSearch, setAppSearch] = useState('')

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', recentExpoId, appTab],
    queryFn: () => listApplicationsByExpo(recentExpoId, { status: appTab, limit: 15 }).then(r => r.data.data),
    enabled: !!recentExpoId,
  })

  const filteredApps = (appsData?.applications || []).filter(app => {
    if (!appSearch) return true
    const name = (app.exhibitorId?.company || app.exhibitorId?.name || '').toLowerCase()
    return name.includes(appSearch.toLowerCase())
  })

  return (
    <div className={`${styles.applicationsCard} ${styles.flexCard}`}>
      <div className={styles.tableHeader}>
        <span className={styles.chartTitle}>Exhibitor Applications</span>
        <div className={styles.tableHeaderRight}>
          {recentExpoId && (
            <Link to={`/organizer/expos/${recentExpoId}/applications`} className={styles.viewAll}>
              View All Applications →
            </Link>
          )}
        </div>
      </div>

      <div className={styles.appTabsWrapper}>
        <div className={styles.tabs}>
          {['all', 'pending', 'approved', 'rejected'].map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${appTab === t ? styles.activeTab : ''}`}
              onClick={() => setAppTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Search exhibitors..."
            className={styles.searchInput}
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
          />
        </div>
      </div>

      {!recentExpoId ? (
        <div className={styles.emptyState}>
          <BarChart2 size={32} />
          <p>No expos yet. <Link to="/organizer/expos/create">Create your first expo →</Link></p>
        </div>
      ) : appsLoading ? (
        <Skeleton count={3} height={44} style={{ marginBottom: 6 }} />
      ) : !filteredApps.length ? (
        <div className={styles.emptyState}>
          <Users size={28} />
          <p>{appSearch ? 'No applications match your search.' : `No ${appTab !== 'all' ? appTab : ''} applications yet.`}</p>
        </div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Exhibitor</th>
                <th>Category</th>
                <th>Applied Date</th>
                <th>Booth Preference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app._id}>
                  <td>
                    <div className={styles.exhibitorCell}>
                      <div className={styles.exAvatar}>
                        {app.exhibitorId?.avatar
                          ? <img src={app.exhibitorId.avatar} alt="" />
                          : app.exhibitorId?.name?.[0]?.toUpperCase()
                        }
                      </div>
                      <span className={styles.exName}>{app.exhibitorId?.company || app.exhibitorId?.name}</span>
                    </div>
                  </td>
                  <td className={styles.muted}>{app.category || 'Technology'}</td>
                  <td className={styles.muted}>{format(new Date(app.appliedAt), 'MMM d, yyyy')}</td>
                  <td className={styles.muted}>{app.boothPreference || 'Hall A - A15'}</td>
                  <td><Badge variant={app.status}>{app.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Isolated Widget: Stats Cards ──────────────────────────────────────
// Own query — fetching/loading won't trigger re-renders on chart or apps.
function StatsWidget() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => getDashboardStats().then(r => r.data.data),
  })
  const stats = statsData || {}

  return (
    <motion.div
      className={styles.statsGrid}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.05 }}
    >
      {STAT_CONFIG.map(({ key, label, icon: Icon, prefix, suffix, color, growthKey }, i) => (
        <motion.div
          key={key}
          className={styles.statCard}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 + i * 0.06 }}
        >
          <div className={styles.statTop}>
            <span className={styles.statLabel}>{label.toUpperCase()}</span>
            <div className={styles.statIcon} style={{ background: `${color}1a`, border: `1px solid ${color}35` }}>
              <Icon size={16} style={{ color }} />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton height={34} width={90} />
          ) : (
            <div className={styles.statValue}>
              {prefix}
              <CountUp end={stats[key] || 0} duration={1.5} separator="," decimals={0} />
              {suffix}
            </div>
          )}
          {growthKey && (
            <div className={styles.statChange}>
              {(stats[growthKey] || 0) >= 0
                ? <><ArrowUpRight size={13} className={styles.up} /><span className={styles.up}>{stats[growthKey] || 0}%</span></>
                : <><ArrowDownRight size={13} className={styles.down} /><span className={styles.down}>{Math.abs(stats[growthKey] || 0)}%</span></>
              }
              <span className={styles.changeSub}> from last month</span>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Isolated Widget: Performance Chart ────────────────────────────────
// Own state for period selector — changing period won't touch other cards.
function PerformanceChartWidget() {
  const [chartPeriod, setChartPeriod] = useState('30d')

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['analytics', 'performance', chartPeriod],
    queryFn: () => getPerformanceChart({ period: chartPeriod }).then(r => r.data.data),
  })

  return (
    <div className={`${styles.chartCard} ${styles.flexCard}`}>
      <div className={styles.chartHeader}>
        <div>
          <span className={styles.chartTitle}>Expo Performance Overview</span>
        </div>
        <select
          className={styles.periodSelect}
          value={chartPeriod}
          onChange={(e) => setChartPeriod(e.target.value)}
        >
          <option value="7d">This Week</option>
          <option value="30d">This Month</option>
          <option value="90d">90 Days</option>
          <option value="1y">1 Year</option>
        </select>
      </div>

      <div className={styles.chartLegend}>
        {[
          { color: '#7c5cbf', label: 'Registrations' },
          { color: '#3b82f6', label: 'Applications' },
          { color: '#14b8a6', label: 'Booth Revenue' },
        ].map(l => (
          <div key={l.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {chartLoading ? (
        <Skeleton height={220} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData?.chartData || []} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c5cbf" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c5cbf" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7c5cbf" floodOpacity="0.4" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#8892b0', fontSize: 10, fontWeight: 500 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fill: '#8892b0', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip
              contentStyle={{
                background: 'rgba(11, 14, 20, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(124, 92, 191, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 0 20px rgba(124, 92, 191, 0.1)',
                color: '#fff',
                padding: '12px'
              }}
              labelStyle={{ color: '#eef0f8', fontSize: 13, fontWeight: 700, marginBottom: '8px' }}
              itemStyle={{ fontSize: 12, fontWeight: 600, padding: '3px 0' }}
              cursor={{ stroke: 'rgba(124, 92, 191, 0.4)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area type="monotone" dataKey="registrations" stroke="#9b74d4" strokeWidth={3} fill="url(#gReg)" name="Registrations" dot={{ r: 4, fill: '#161a26', stroke: '#9b74d4', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff', stroke: '#9b74d4', strokeWidth: 3 }} filter="url(#glow)" />
            <Area type="monotone" dataKey="applications"  stroke="#60a5fa" strokeWidth={3} fill="url(#gAtt)"  name="Applications"  dot={{ r: 4, fill: '#161a26', stroke: '#60a5fa', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff', stroke: '#60a5fa', strokeWidth: 3 }} />
            <Area type="monotone" dataKey="revenue"       stroke="#2dd4bf" strokeWidth={3} fill="url(#gVis)"  name="Booth Revenue ($)"  dot={{ r: 4, fill: '#161a26', stroke: '#2dd4bf', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff', stroke: '#2dd4bf', strokeWidth: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
