import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { FileText } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { motion, AnimatePresence } from 'framer-motion'
import { listMyApplications } from '../../api/application.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './ExhApplicationsPage.module.css'

export default function ExhApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'my'],
    queryFn: () => listMyApplications().then(r => r.data.data),
  })

  const apps = data?.applications || []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Applications</h1>
        <p className={styles.sub}>{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
      </div>

      {isLoading ? <Skeleton count={4} height={80} style={{ marginBottom: 8 }} /> :
       !apps.length ? (
        <div className={styles.empty}>
          <FileText size={40} />
          <h3>No applications yet</h3>
          <p>Browse expos and apply to participate</p>
        </div>
      ) : (
        <div className={styles.list}>
          <AnimatePresence initial={false}>
            {apps.map(app => (
              <motion.div 
                key={app._id} 
                className={styles.appCard}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className={styles.expoBanner}>
                  {app.expoId?.bannerImage
                    ? <img src={app.expoId.bannerImage} alt="" />
                    : app.expoId?.name?.[0]
                  }
                </div>
                <div className={styles.appInfo}>
                  <h3 className={styles.expoName}>{app.expoId?.name || 'Expo'}</h3>
                  <div className={styles.appMeta}>
                    {app.expoId?.location?.city && (
                      <span>{app.expoId.location.city}, {app.expoId.location.country}</span>
                    )}
                    {app.expoId?.startDate && (
                      <span>
                        {format(new Date(app.expoId.startDate), 'MMM d')} – {format(new Date(app.expoId.endDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <p className={styles.appDate}>Applied {format(new Date(app.appliedAt), 'MMM d, yyyy')}</p>
                </div>
                <div className={styles.appRight}>
                  <Badge variant={app.status}>{app.status}</Badge>
                  {app.organizerNote && (
                    <div className={styles.orgNote}>
                      <span className={styles.noteLabel}>Organizer note:</span>
                      <span className={styles.noteText}>{app.organizerNote}</span>
                    </div>
                  )}
                  {app.boothPreference && (
                    <p className={styles.boothPref}>Booth pref: {app.boothPreference}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
