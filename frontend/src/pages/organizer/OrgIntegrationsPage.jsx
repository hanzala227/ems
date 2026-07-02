import { motion } from 'framer-motion'
import { Plug, Zap, Globe, Mail, BarChart2, CreditCard } from 'lucide-react'
import styles from './OrgIntegrationsPage.module.css'

const INTEGRATIONS = [
  { icon: Mail,      name: 'Email (SMTP)',      desc: 'Send transactional emails via your SMTP server',         status: 'available' },
  { icon: CreditCard, name: 'Stripe',           desc: 'Accept payments for booth rentals and registrations',    status: 'coming_soon' },
  { icon: BarChart2,  name: 'Google Analytics', desc: 'Track expo page views and conversion funnel',           status: 'coming_soon' },
  { icon: Globe,      name: 'Zapier',           desc: 'Connect EventSphere to 5,000+ apps via Zapier',         status: 'coming_soon' },
  { icon: Zap,        name: 'Webhooks',         desc: 'Receive real-time events via HTTP webhooks',             status: 'coming_soon' },
]

export default function OrgIntegrationsPage() {
  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={styles.title}>Integrations</h1>
          <p className={styles.sub}>Connect EventSphere with your existing tools and services</p>
        </div>
      </motion.div>

      <div className={styles.grid}>
        {INTEGRATIONS.map((int, i) => {
          const Icon = int.icon
          return (
            <motion.div
              key={int.name}
              className={styles.card}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconWrap}><Icon size={20} /></div>
                <span className={`${styles.status} ${styles[int.status]}`}>
                  {int.status === 'available' ? 'Available' : 'Coming Soon'}
                </span>
              </div>
              <h3 className={styles.intName}>{int.name}</h3>
              <p className={styles.intDesc}>{int.desc}</p>
              <button
                className={`${styles.connectBtn} ${int.status !== 'available' ? styles.disabled : ''}`}
                disabled={int.status !== 'available'}
              >
                {int.status === 'available' ? 'Configure' : 'Notify Me'}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
