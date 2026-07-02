import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Layout, CalendarDays, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { listMyExpos } from '../../api/expo.api'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import Badge from '../../components/ui/Badge/Badge'
import styles from './OrgFloorPlanSelectPage.module.css'

export default function OrgFloorPlanSelectPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['expos', 'my'],
    queryFn: () => listMyExpos().then(r => r.data.data),
  })

  const expos = data?.expos || []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Floor Plan Management</h1>
          <p className={styles.subtitle}>Select an expo to open the Interactive Floor Plan Editor.</p>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map(i => <Skeleton key={i} height={200} borderRadius={16} />)}
        </div>
      ) : expos.length === 0 ? (
        <div className={styles.emptyState}>
          <Layout size={40} />
          <h2>No expos found</h2>
          <p>Create an expo first before managing its floor plan.</p>
          <Link to="/organizer/expos/create" className={styles.btnPrimary}>Create Expo</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {expos.map(expo => (
            <Link key={expo._id} to={`/organizer/expos/${expo._id}/floor-plan`} className={styles.card}>
              <div className={styles.cardImg}>
                {expo.bannerImage ? (
                  <img src={expo.bannerImage} alt={expo.name} />
                ) : (
                  <div className={styles.placeholderImg}>
                    <CalendarDays size={24} />
                  </div>
                )}
                <div className={styles.statusBadge}>
                  <Badge variant={expo.status.toLowerCase()}>{expo.status}</Badge>
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{expo.name}</h3>
                <p className={styles.cardDate}>
                  {format(new Date(expo.startDate), 'MMM d')} – {format(new Date(expo.endDate), 'MMM d, yyyy')}
                </p>
                <div className={styles.cardAction}>
                  <span>Edit Floor Plan</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
