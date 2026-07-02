import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CountUpLib from 'react-countup'
const CountUp = CountUpLib.default ?? CountUpLib
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getDashboardStats, getPerformanceChart, getEngagement, getOccupancy } from '../../api/analytics.api'
import styles from './AnalyticsPage.module.css'

const COLORS = ['#7c5cbf', '#22c55e', '#3b82f6', '#f59e0b', '#0d9488']

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')

  const { data: stats } = useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: () => getDashboardStats().then(r => r.data.data) })
  const { data: perf, isLoading: perfLoading } = useQuery({ queryKey: ['analytics', 'performance', period], queryFn: () => getPerformanceChart({ period }).then(r => r.data.data) })
  const { data: eng } = useQuery({ queryKey: ['analytics', 'engagement'], queryFn: () => getEngagement().then(r => r.data.data) })
  const { data: occ } = useQuery({ queryKey: ['analytics', 'occupancy'], queryFn: () => getOccupancy().then(r => r.data.data) })

  const pieData = eng?.boothBreakdown ? Object.entries(eng.boothBreakdown).map(([name, value]) => ({ name, value })) : []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <select className={styles.periodSelect} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: 'Total Expos', val: stats?.totalExpos || 0, prefix: '' },
          { label: 'Total Exhibitors', val: stats?.totalExhibitors || 0, prefix: '' },
          { label: 'Total Attendees', val: stats?.totalAttendees || 0, prefix: '' },
          { label: 'Total Revenue', val: stats?.totalRevenue || 0, prefix: '$' },
          { label: 'Booth Occupancy', val: stats?.boothOccupancy || 0, suffix: '%' },
        ].map(({ label, val, prefix = '', suffix = '' }) => (
          <div key={label} className={styles.statCard}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statValue}>{prefix}<CountUp end={val} duration={1.2} separator="," />{suffix}</span>
          </div>
        ))}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Registration & Application Trends</h2>
          {perfLoading ? <Skeleton height={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={perf?.chartData || []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c5cbf" stopOpacity={0.3}/><stop offset="95%" stopColor="#7c5cbf" stopOpacity={0}/></linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#252836" />
                <XAxis dataKey="date" tick={{ fill: '#8b8fa8', fontSize: 11 }} tickFormatter={v => v.slice(5)} axisLine={false} />
                <YAxis tick={{ fill: '#8b8fa8', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #252836', borderRadius: 10 }} labelStyle={{ color: '#f0f0f5' }} itemStyle={{ color: '#8b8fa8' }} />
                <Area type="monotone" dataKey="registrations" stroke="#7c5cbf" fill="url(#g1)" name="Registrations" />
                <Area type="monotone" dataKey="applications" stroke="#22c55e" fill="url(#g2)" name="Applications" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Booth Status Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #252836', borderRadius: 10 }} />
                <Legend iconSize={10} iconType="circle" formatter={v => <span style={{ color: '#8b8fa8', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className={styles.empty}>No booth data yet.</p>}
        </div>
      </div>

      {occ?.occupancy?.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Booth Occupancy by Expo</h2>
          <div className={styles.occList}>
            {occ.occupancy.map(item => (
              <div key={item.expoId} className={styles.occItem}>
                <span className={styles.occName}>{item.expoName}</span>
                <div className={styles.occBar}>
                  <div className={styles.occFill} style={{ width: `${item.rate}%` }} />
                </div>
                <span className={styles.occRate}>{item.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
