import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { listMyExpos, deleteExpo, changeExpoStatus } from '../../api/expo.api'
import Badge from '../../components/ui/Badge/Badge'
import Modal from '../../components/ui/Modal/Modal'
import Button from '../../components/ui/Button/Button'
import styles from './ExposPage.module.css'

const STATUSES = ['All', 'Draft', 'Published', 'Live', 'Ended', 'Cancelled']

export default function ExposPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['expos', 'my', search, statusFilter, page],
    queryFn: () => listMyExpos({
      search: search || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      page, limit: 10,
    }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExpo(id),
    onSuccess: () => { toast.success('Expo deleted'); qc.invalidateQueries(['expos']); setDeleteTarget(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => changeExpoStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['expos']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const expos = data?.expos || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Expos</h1>
          <p className={styles.sub}>{total} expo{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/organizer/expos/create" className={styles.createBtn}>
          <Plus size={16} /> Create Expo
        </Link>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search expos..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className={styles.statusTabs}>
          {STATUSES.map((s) => (
            <button key={s} className={`${styles.tab} ${statusFilter === s ? styles.activeTab : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1) }}>{s}</button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        {isLoading ? <Skeleton count={5} height={56} style={{ marginBottom: 8 }} /> :
         !expos.length ? (
          <div className={styles.empty}>
            <p>No expos found.</p>
            <Link to="/organizer/expos/create" className={styles.emptyLink}>Create your first expo →</Link>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>Expo</th><th>Dates</th><th>Location</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {expos.map((expo) => (
                <tr key={expo._id}>
                  <td>
                    <div className={styles.expoCell}>
                      <div className={styles.expoBanner}>
                        {expo.bannerImage ? <img src={expo.bannerImage} alt="" /> : expo.name[0].toUpperCase()}
                      </div>
                      <div>
                        <span className={styles.expoName}>{expo.name}</span>
                        {expo.category && <span className={styles.expoCat}>{expo.category}</span>}
                      </div>
                    </div>
                  </td>
                  <td className={styles.muted}>
                    {format(new Date(expo.startDate), 'MMM d')} – {format(new Date(expo.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className={styles.muted}>
                    {expo.location?.city}{expo.location?.city && expo.location?.country ? ', ' : ''}{expo.location?.country || '—'}
                  </td>
                  <td>
                    <select className={styles.statusSelect} value={expo.status}
                      onChange={(e) => statusMutation.mutate({ id: expo._id, status: e.target.value })}>
                      {['Draft','Published','Live','Ended','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/organizer/expos/${expo._id}`} className={styles.actionBtn} title="View"><Eye size={15} /></Link>
                      <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={() => setDeleteTarget(expo)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>Prev</button>
            <span className={styles.pageInfo}>{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next</button>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Expo"
        footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget._id)}>Delete</Button></>}>
        <p className={styles.deleteMsg}>Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  )
}
