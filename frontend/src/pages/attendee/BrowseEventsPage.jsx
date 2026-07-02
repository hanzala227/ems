import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, MapPin, Calendar } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { motion, AnimatePresence } from 'framer-motion'
import { listPublicExpos } from '../../api/expo.api'
import { listMyRegistrations } from '../../api/registration.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './BrowseEventsPage.module.css'

const MotionLink = motion(Link)

export default function BrowseEventsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['expos', 'public', search, page],
    queryFn: () => listPublicExpos({ search: search || undefined, page, limit: 12 }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const { data: regsData } = useQuery({
    queryKey: ['registrations', 'my'],
    queryFn: () => listMyRegistrations().then(r => r.data.data),
  })

  const registeredIds = new Set((regsData?.registrations || []).map(r => r.expoId?._id || r.expoId))
  const expos = data?.expos || []
  const pages = data?.pages || 1

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Discover Events</h1>
        <p className={styles.sub}>Find and register for upcoming expos and exhibitions</p>
      </div>

      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search events by name, location, category..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={260} borderRadius={16} />)}
        </div>
      ) : !expos.length ? (
        <div className={styles.empty}>
          <Search size={40} />
          <h3>No events found</h3>
          <p>Try a different search term</p>
        </div>
      ) : (
        <div className={styles.grid}>
          <AnimatePresence initial={false}>
            {expos.map(expo => {
              const registered = registeredIds.has(expo._id)
              return (
                <MotionLink 
                  key={expo._id} 
                  to={`/attendee/events/${expo._id}`} 
                  className={styles.card}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.banner}>
                    {expo.bannerImage ? <img src={expo.bannerImage} alt="" /> : <div className={styles.bannerFallback}>{expo.name[0]}</div>}
                    <Badge variant={expo.status.toLowerCase()} className={styles.statusBadge}>{expo.status}</Badge>
                    {registered && <span className={styles.registeredBadge}>✓ Registered</span>}
                  </div>
                  <div className={styles.body}>
                    <h3 className={styles.expoName}>{expo.name}</h3>
                    {expo.category && <p className={styles.expoCat}>{expo.category}</p>}
                    <div className={styles.meta}>
                      <div className={styles.metaRow}><Calendar size={12} /><span>{format(new Date(expo.startDate), 'MMM d')} – {format(new Date(expo.endDate), 'MMM d, yyyy')}</span></div>
                      {expo.location?.city && <div className={styles.metaRow}><MapPin size={12} /><span>{expo.location.city}, {expo.location.country}</span></div>}
                    </div>
                  </div>
                </MotionLink>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {pages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>← Prev</button>
          <span>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  )
}
