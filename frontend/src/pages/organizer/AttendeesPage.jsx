import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Users, Search, Calendar, MapPin, ArrowRight } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { listAttendeesByExpo } from '../../api/registration.api'
import { listMyExpos } from '../../api/expo.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './AttendeesPage.module.css'

// Per-expo attendee list component (used when expoId is in URL params)
function ExpoAttendeesView({ expoId }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['registrations', expoId, page],
    queryFn: () => listAttendeesByExpo(expoId, { page, limit: 20 }).then(r => r.data.data),
    enabled: !!expoId,
  })

  const registrations = (data?.registrations || []).filter(r =>
    !search ||
    r.attendeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.attendeeId?.email?.toLowerCase().includes(search.toLowerCase())
  )
  const total = data?.total || 0

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search attendees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className={styles.totalBadge}>{total} registered</span>
      </div>

      <div className={styles.card}>
        {isLoading ? (
          <Skeleton count={6} height={56} style={{ marginBottom: 6 }} />
        ) : !registrations.length ? (
          <div className={styles.empty}>
            <Users size={40} />
            <h3>No attendees found</h3>
            <p>{search ? 'Try a different search term' : 'No one has registered for this expo yet'}</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg, i) => (
                <motion.tr
                  key={reg._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <div className={styles.attendeeCell}>
                      <div className={styles.avatar}>
                        {reg.attendeeId?.avatar
                          ? <img src={reg.attendeeId.avatar} alt="" />
                          : reg.attendeeId?.name?.[0]?.toUpperCase()
                        }
                      </div>
                      <div>
                        <span className={styles.name}>{reg.attendeeId?.name}</span>
                        <span className={styles.email}>{reg.attendeeId?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.muted}>
                    {reg.registeredAt && format(new Date(reg.registeredAt), 'MMM d, yyyy')}
                  </td>
                  <td><Badge variant={reg.status}>{reg.status}</Badge></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data?.pages || 1) > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>← Prev</button>
          <span className={styles.pageInfo}>{page} / {data?.pages}</span>
          <button disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next →</button>
        </div>
      )}
    </>
  )
}

// Global attendees page — shows all expos with attendee counts
function GlobalAttendeesView() {
  const { data, isLoading } = useQuery({
    queryKey: ['expos', 'my', 'attendees'],
    queryFn: () => listMyExpos({ limit: 50 }).then(r => r.data.data),
  })

  const expos = (data?.expos || []).filter(e => !e.isDeleted)

  if (isLoading) return (
    <div className={styles.grid}>
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={140} borderRadius={14} />)}
    </div>
  )

  if (!expos.length) return (
    <div className={styles.empty}>
      <Users size={48} />
      <h3>No expos yet</h3>
      <p>Create an expo to start tracking attendees</p>
      <Link to="/organizer/expos/create" className={styles.emptyBtn}>Create Expo</Link>
    </div>
  )

  return (
    <div className={styles.grid}>
      {expos.map((expo, i) => (
        <motion.div
          key={expo._id}
          className={styles.expoCard}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className={styles.expoBanner}>
            {expo.bannerImage
              ? <img src={expo.bannerImage} alt="" />
              : <div className={styles.bannerFallback}><Users size={20} /></div>
            }
            <Badge variant={expo.status.toLowerCase()} className={styles.statusBadge}>
              {expo.status}
            </Badge>
          </div>
          <div className={styles.expoBody}>
            <h3 className={styles.expoName}>{expo.name}</h3>
            <div className={styles.expoMeta}>
              <span><Calendar size={11} /> {format(new Date(expo.startDate), 'MMM d, yyyy')}</span>
              {expo.location?.city && <span><MapPin size={11} /> {expo.location.city}</span>}
            </div>
            <div className={styles.attendeeCount}>
              <Users size={14} />
              <strong>{expo.registeredCount || 0}</strong>
              <span>/ {expo.capacity || '∞'} attendees</span>
            </div>
            <Link to={`/organizer/expos/${expo._id}/attendees`} className={styles.viewBtn}>
              View Attendees <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function AttendeesPage() {
  // If accessed from /organizer/expos/:id/attendees, show per-expo list
  const { id: expoId } = useParams()

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className={styles.title}>Attendees</h1>
          <p className={styles.sub}>
            {expoId ? 'Registered attendees for this expo' : 'Manage attendees across all your expos'}
          </p>
        </div>
      </motion.div>

      {expoId ? <ExpoAttendeesView expoId={expoId} /> : <GlobalAttendeesView />}
    </div>
  )
}
