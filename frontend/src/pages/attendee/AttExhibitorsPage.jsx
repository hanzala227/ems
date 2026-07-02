import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Store, MapPin, Search, Building2, ChevronLeft, Mail, Globe, FileText } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { getExpo } from '../../api/expo.api'
import * as hallApi from '../../api/hall.api'
import * as boothApi from '../../api/booth.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './AttExhibitorsPage.module.css'

// Component to fetch and display exhibitors from all halls of an expo
function ExhibitorCard({ booth, index }) {
  const exhibitor = booth.exhibitorId
  if (!exhibitor) return null

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          {exhibitor.avatar
            ? <img src={exhibitor.avatar} alt={exhibitor.name} />
            : <span>{(exhibitor.company || exhibitor.name)?.[0]?.toUpperCase()}</span>
          }
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.company}>{exhibitor.company || exhibitor.name}</h3>
          {exhibitor.company && <p className={styles.person}>{exhibitor.name}</p>}
        </div>
        <Badge variant="occupied" className={styles.boothBadge}>
          <Store size={10} />
          {booth.boothNumber}
        </Badge>
      </div>

      {exhibitor.bio && (
        <p className={styles.bio}>{exhibitor.bio}</p>
      )}

      <div className={styles.meta}>
        {exhibitor.industry && (
          <span className={styles.tag}>
            <FileText size={10} /> {exhibitor.industry}
          </span>
        )}
        {exhibitor.email && (
          <span className={styles.tag}>
            <Mail size={10} /> {exhibitor.email}
          </span>
        )}
        {exhibitor.website && (
          <a
            href={exhibitor.website.startsWith('http') ? exhibitor.website : `https://${exhibitor.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.websiteLink}
          >
            <Globe size={10} /> Website
          </a>
        )}
      </div>

      <div className={styles.cardFooter}>
        <MapPin size={11} className={styles.locIcon} />
        <span className={styles.hallName}>{booth.hallId?.name || 'Hall'} · Booth {booth.boothNumber}</span>
      </div>
    </motion.div>
  )
}

// Fetches booths for a single hall and shows occupied ones
function HallExhibitors({ hallId, search }) {
  const { data, isLoading } = useQuery({
    queryKey: ['booths', hallId],
    queryFn: () => boothApi.listBoothsByHall(hallId).then(r => r.data.data),
    enabled: !!hallId,
  })

  const exhibitorBooths = (data?.booths || []).filter(b =>
    b.status === 'occupied' && b.exhibitorId &&
    (!search || (b.exhibitorId.company || b.exhibitorId.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.exhibitorId.industry || '').toLowerCase().includes(search.toLowerCase()))
  )

  if (isLoading) return (
    <div className={styles.skeletonGrid}>
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={180} borderRadius={14} />)}
    </div>
  )

  return exhibitorBooths.map((booth, i) => (
    <ExhibitorCard key={booth._id} booth={booth} index={i} />
  ))
}

export default function AttExhibitorsPage() {
  const { id: expoId } = useParams()
  const [search, setSearch] = useState('')

  const { data: expoData } = useQuery({
    queryKey: ['expo', expoId],
    queryFn: () => getExpo(expoId).then(r => r.data.data),
    enabled: !!expoId,
  })

  const { data: hallsData, isLoading: hallsLoading } = useQuery({
    queryKey: ['halls', expoId],
    queryFn: () => hallApi.listHallsByExpo(expoId).then(r => r.data.data),
    enabled: !!expoId,
  })

  const expo  = expoData?.expo
  const halls = hallsData?.halls || []

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link to={`/attendee/events/${expoId}`} className={styles.backBtn}>
          <ChevronLeft size={16} /> Event Details
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Exhibitors</h1>
          <p className={styles.sub}>
            {expo?.name ? `Companies exhibiting at ${expo.name}` : 'Loading...'}
          </p>
        </div>
      </motion.div>

      {/* ── Search ──────────────────────────────────────── */}
      <motion.div
        className={styles.searchWrap}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Search size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search exhibitors by name or industry..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </motion.div>

      {/* ── Content ─────────────────────────────────────── */}
      {hallsLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={180} borderRadius={14} />)}
        </div>
      ) : !halls.length ? (
        <div className={styles.empty}>
          <Building2 size={48} />
          <h3>No halls configured</h3>
          <p>The event organizer hasn't set up the floor plan yet.</p>
        </div>
      ) : (
        <div>
          {halls.map(hall => (
            <div key={hall._id} className={styles.hallSection}>
              <div className={styles.hallLabel}>
                <Building2 size={14} />
                <span>{hall.name}</span>
                <span className={styles.hallDim}>{hall.rows}×{hall.columns}</span>
              </div>
              <div className={styles.grid}>
                <HallExhibitors hallId={hall._id} search={search} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
