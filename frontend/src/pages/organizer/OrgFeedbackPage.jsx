import { motion } from 'framer-motion'
import { MessageCircle, Star, TrendingUp } from 'lucide-react'
import styles from './OrgFeedbackPage.module.css'

export default function OrgFeedbackPage() {
  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={styles.title}>Feedback</h1>
          <p className={styles.sub}>Attendee and exhibitor feedback across your events</p>
        </div>
      </motion.div>

      <div className={styles.statsGrid}>
        {[
          { icon: Star, label: 'Avg. Rating', value: '—', color: '#f59e0b' },
          { icon: MessageCircle, label: 'Total Reviews', value: '—', color: '#7c5cbf' },
          { icon: TrendingUp, label: 'Sentiment', value: '—', color: '#22c55e' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.comingSoon}>
        <MessageCircle size={48} />
        <h3>Feedback Module Coming Soon</h3>
        <p>Post-event surveys, ratings collection, and sentiment analysis will be available here.</p>
      </div>
    </div>
  )
}
