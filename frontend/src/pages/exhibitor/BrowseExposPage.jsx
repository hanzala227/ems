import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, MapPin, Calendar } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { motion, AnimatePresence } from 'framer-motion'
import { listPublicExpos } from '../../api/expo.api'
import { listMyApplications } from '../../api/application.api'
import Badge from '../../components/ui/Badge/Badge'
import ApplicationModal from './ApplicationModal'
import styles from './BrowseExposPage.module.css'

const CATEGORIES = ['All', 'Technology', 'Business', 'Arts', 'Health', 'Education', 'Sustainability', 'Other']

export default function BrowseExposPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [applyTarget, setApplyTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['expos', 'public', search, category, page],
    queryFn: () => listPublicExpos({
      search: search || undefined,
      category: category !== 'All' ? category : undefined,
      page, limit: 12,
    }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const { data: appsData } = useQuery({
    queryKey: ['applications', 'my'],
    queryFn: () => listMyApplications().then(r => r.data.data),
  })

  const appliedExpoIds = new Set((appsData?.applications || []).map(a => a.expoId?._id || a.expoId))
  const expos = data?.expos || []
  const pages = data?.pages || 1

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Browse Expos</h1>
        <p className={styles.sub}>Find and apply to upcoming trade shows and exhibitions</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search by name, location, category..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className={styles.categoryTabs}>
          {CATEGORIES.map(c => (
            <button key={c}
              className={`${styles.catTab} ${category === c ? styles.activeCat : ''}`}
              onClick={() => { setCategory(c); setPage(1) }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Expo grid */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={260} borderRadius={16} />)}
        </div>
      ) : !expos.length ? (
        <div className={styles.empty}>
          <Search size={40} />
          <h3>No expos found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={styles.grid}>
          <AnimatePresence initial={false}>
            {expos.map(expo => {
              const hasApplied = appliedExpoIds.has(expo._id)
              return (
                <motion.div 
                  key={expo._id} 
                  className={styles.expoCard}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.cardBanner}>
                    {expo.bannerImage
                      ? <img src={expo.bannerImage} alt={expo.name} />
                      : <div className={styles.bannerFallback}>{expo.name[0]}</div>
                    }
                    <Badge variant={expo.status.toLowerCase()} className={styles.statusBadge}>{expo.status}</Badge>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.expoName}>{expo.name}</h3>
                    {expo.category && <p className={styles.expoCat}>{expo.category}</p>}
                    <div className={styles.expoDates}>
                      <Calendar size={13} />
                      <span>{format(new Date(expo.startDate), 'MMM d')} – {format(new Date(expo.endDate), 'MMM d, yyyy')}</span>
                    </div>
                    {expo.location?.city && (
                      <div className={styles.expoLoc}>
                        <MapPin size={13} />
                        <span>{expo.location.city}, {expo.location.country}</span>
                      </div>
                    )}
                    <div className={styles.cardActions}>
                      {hasApplied ? (
                        <button className={styles.appliedBtn} disabled>
                          ✓ Applied
                        </button>
                      ) : (
                        <button className={styles.applyBtn} onClick={() => setApplyTarget(expo)}>
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>← Prev</button>
          <span className={styles.pageInfo}>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next →</button>
        </div>
      )}

      {/* Application modal */}
      {applyTarget && (
        <ApplicationModal
          expo={applyTarget}
          onClose={() => setApplyTarget(null)}
        />
      )}
    </div>
  )
}
