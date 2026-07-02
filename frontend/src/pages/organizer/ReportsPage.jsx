import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQuery as useQueryExpos } from '@tanstack/react-query'
import CountUpLib from 'react-countup'
const CountUp = CountUpLib.default ?? CountUpLib
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Printer, BarChart2, Users, Map, CalendarDays } from 'lucide-react'
import { getDashboardStats, getPerformanceChart, getEngagement, getOccupancy } from '../../api/analytics.api'
import { listMyExpos } from '../../api/expo.api'
import Button from '../../components/ui/Button/Button'
import styles from './ReportsPage.module.css'

const COLORS = ['#7c5cbf', '#22c55e', '#3b82f6', '#f59e0b', '#0d9488']

const REPORT_TYPES = [
  { id: 'performance',  label: 'Expo Performance',     icon: BarChart2,    desc: 'Registrations, applications, and activity trends' },
  { id: 'engagement',   label: 'Attendee Engagement',  icon: Users,        desc: 'Attendee breakdown and engagement metrics' },
  { id: 'occupancy',    label: 'Booth Occupancy',      icon: Map,          desc: 'Booth status breakdown per expo' },
  { id: 'overview',     label: 'Executive Overview',   icon: CalendarDays, desc: 'High-level summary across all expos' },
]

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('overview')
  const [period, setPeriod] = useState('30d')

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => getDashboardStats().then(r => r.data.data),
  })

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['analytics', 'performance', period],
    queryFn: () => getPerformanceChart({ period }).then(r => r.data.data),
  })

  const { data: engData } = useQuery({
    queryKey: ['analytics', 'engagement'],
    queryFn: () => getEngagement().then(r => r.data.data),
  })

  const { data: occData } = useQuery({
    queryKey: ['analytics', 'occupancy'],
    queryFn: () => getOccupancy().then(r => r.data.data),
  })

  const stats = statsData || {}
  const pieData = engData?.boothBreakdown
    ? Object.entries(engData.boothBreakdown).map(([name, value]) => ({ name, value }))
    : []

  const handlePrint = () => window.print()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.sub}>Analytics and performance data across all your expos</p>
        </div>
        <div className={styles.headerActions}>
          <select className={styles.periodSelect} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer size={14} /> Print Report
          </Button>
        </div>
      </div>

      {/* Report type selector */}
      <div className={styles.reportTabs}>
        {REPORT_TYPES.map(r => (
          <button
            key={r.id}
            className={`${styles.reportTab} ${activeReport === r.id ? styles.activeReportTab : ''}`}
            onClick={() => setActiveReport(r.id)}
          >
            <r.icon size={16} />
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Overview report */}
      {activeReport === 'overview' && (
        <div className={styles.reportContent}>
          <div className={styles.statsGrid}>
            {statsLoading ? <Skeleton count={5} height={100} /> : (
              [
                { label: 'Total Expos',      val: stats.totalExpos || 0,      prefix: '',  color: '#7c5cbf' },
                { label: 'Total Exhibitors', val: stats.totalExhibitors || 0, prefix: '',  color: '#22c55e' },
                { label: 'Total Attendees',  val: stats.totalAttendees || 0,  prefix: '',  color: '#3b82f6' },
                { label: 'Total Revenue',    val: stats.totalRevenue || 0,    prefix: '$', color: '#f59e0b' },
                { label: 'Booth Occupancy',  val: stats.boothOccupancy || 0,  suffix: '%', color: '#0d9488' },
              ].map(({ label, val, prefix = '', suffix = '', color }) => (
                <div key={label} className={styles.statCard}>
                  <div className={styles.statDot} style={{ background: color }} />
                  <div className={styles.statVal}>{prefix}<CountUp end={val} duration={1.2} separator="," />{suffix}</div>
                  <div className={styles.statLbl}>{label}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Performance report */}
      {activeReport === 'performance' && (
        <div className={styles.reportContent}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Registration & Application Trends</h3>
            {perfLoading ? <Skeleton height={280} /> : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={perfData?.chartData || []}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c5cbf" stopOpacity={0.3}/><stop offset="95%" stopColor="#7c5cbf" stopOpacity={0}/></linearGradient>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252836" />
                  <XAxis dataKey="date" tick={{ fill: '#8b8fa8', fontSize: 11 }} tickFormatter={v => v.slice(5)} axisLine={false} />
                  <YAxis tick={{ fill: '#8b8fa8', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #252836', borderRadius: 10 }} labelStyle={{ color: '#f0f0f5' }} itemStyle={{ color: '#8b8fa8' }} />
                  <Area type="monotone" dataKey="registrations" stroke="#7c5cbf" fill="url(#rg)" name="Registrations" />
                  <Area type="monotone" dataKey="applications" stroke="#22c55e" fill="url(#ag)" name="Applications" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Engagement report */}
      {activeReport === 'engagement' && (
        <div className={styles.reportContent}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Attendee Engagement Breakdown</h3>
            <div className={styles.engRow}>
              <div>
                <div className={styles.bigNum}><CountUp end={engData?.totalAttendees || 0} duration={1.2} separator="," /></div>
                <p className={styles.bigLbl}>Total Attendees</p>
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #252836', borderRadius: 10 }} />
                    <Legend iconSize={10} iconType="circle" formatter={v => <span style={{ color: '#8b8fa8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className={styles.emptyTxt}>No booth data yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Occupancy report */}
      {activeReport === 'occupancy' && (
        <div className={styles.reportContent}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Booth Occupancy Rate by Expo</h3>
            {!occData?.occupancy?.length ? (
              <p className={styles.emptyTxt}>No occupancy data yet.</p>
            ) : (
              <div className={styles.occList}>
                {occData.occupancy.map(item => (
                  <div key={item.expoId} className={styles.occItem}>
                    <span className={styles.occName}>{item.expoName}</span>
                    <div className={styles.occBarWrap}>
                      <div className={styles.occBar} style={{ width: `${item.rate}%` }} />
                    </div>
                    <span className={styles.occRate}>{item.rate}%</span>
                    <span className={styles.occDetail}>{item.occupied}/{item.total} booths</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
