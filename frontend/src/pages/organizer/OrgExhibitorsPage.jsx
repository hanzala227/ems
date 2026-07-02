import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, Users, Building2, Globe, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { searchUsers } from '../../api/user.api'
import { listMyExpos } from '../../api/expo.api'
import { listApplicationsByExpo, listOrganizerExhibitors } from '../../api/application.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './OrgExhibitorsPage.module.css'

export default function OrgExhibitorsPage() {
  const [search, setSearch] = useState('')
  const [selectedExpo, setSelectedExpo] = useState('')

  const { data: exposData } = useQuery({
    queryKey: ['expos', 'my', 'all'],
    queryFn: () => listMyExpos({ limit: 50 }).then(r => r.data.data),
  })

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['applications', selectedExpo || 'all', 'approved'],
    queryFn: () => selectedExpo
      ? listApplicationsByExpo(selectedExpo, { status: 'approved', limit: 100 }).then(r => r.data.data)
      : listOrganizerExhibitors().then(r => r.data.data),
    enabled: true,
  })

  const expos = exposData?.expos || []
  const applications = appsData?.applications || []
  const users = appsData?.users || []

  const displayData = selectedExpo
    ? applications.filter(a =>
        !search ||
        a.exhibitorId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.exhibitorId?.company?.toLowerCase().includes(search.toLowerCase())
      )
    : users.filter(u =>
        u.role === 'exhibitor' &&
        (!search ||
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.company?.toLowerCase().includes(search.toLowerCase()))
      )

  return (
    <div className={styles.page}>
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div>
          <h1 className={styles.title}>Exhibitors</h1>
          <p className={styles.sub}>Manage all exhibitors across your expos</p>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statPill}>
            <Users size={13} />
            <span>{displayData.length} exhibitors</span>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.expoSelect}
          value={selectedExpo}
          onChange={e => setSelectedExpo(e.target.value)}
        >
          <option value="">All Exhibitors</option>
          {expos.map(e => (
            <option key={e._id} value={e._id}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={180} borderRadius={14} />
          ))}
        </div>
      ) : !displayData.length ? (
        <div className={styles.empty}>
          <Users size={44} />
          <h3>No exhibitors found</h3>
          <p>{search ? 'Try a different search term' : 'Exhibitors who apply and are approved will appear here'}</p>
        </div>
      ) : (
        <motion.div
          className={styles.grid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {(selectedExpo ? displayData : displayData).map((item, i) => {
            const exh = selectedExpo ? item.exhibitorId : item
            if (!exh) return null
            return (
              <motion.div
                key={item._id || exh._id}
                className={styles.card}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.avatar}>
                    {exh.avatar
                      ? <img src={exh.avatar} alt={exh.name} />
                      : <span>{exh.name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.name}>{exh.company || exh.name}</h3>
                    <p className={styles.email}>{exh.email}</p>
                  </div>
                  {selectedExpo && <Badge variant={item.status}>{item.status}</Badge>}
                </div>

                <div className={styles.tags}>
                  {exh.industry && (
                    <span className={styles.tag}><Building2 size={11} />{exh.industry}</span>
                  )}
                </div>

                <div className={styles.meta}>
                  {exh.website && (
                    <a href={exh.website} target="_blank" rel="noreferrer" className={styles.metaItem}>
                      <Globe size={12} /> <span>{exh.website.replace(/https?:\/\//, '')}</span>
                    </a>
                  )}
                  {exh.phone && (
                    <span className={styles.metaItem}>
                      <Phone size={12} /> <span>{exh.phone}</span>
                    </span>
                  )}
                  {(selectedExpo ? item.appliedAt : exh.createdAt) && (
                    <span className={styles.metaDate}>
                      Joined {format(new Date(selectedExpo ? item.appliedAt : exh.createdAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
