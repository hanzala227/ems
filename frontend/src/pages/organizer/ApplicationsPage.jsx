import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, Info, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { listApplicationsByExpo, approveApplication, rejectApplication } from '../../api/application.api'
import Badge from '../../components/ui/Badge/Badge'
import Modal from '../../components/ui/Modal/Modal'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import styles from './ApplicationsPage.module.css'

const TABS = ['all', 'pending', 'approved', 'rejected']

export default function ApplicationsPage() {
  const { id: expoId } = useParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [detailsTarget, setDetailsTarget] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [approveNote, setApproveNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['applications', expoId, tab, search],
    queryFn: () => listApplicationsByExpo(expoId, {
      status: tab !== 'all' ? tab : undefined,
      search: search || undefined,
    }).then(r => r.data.data),
    enabled: !!expoId,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => approveApplication(id, { organizerNote: approveNote }),
    onSuccess: () => { toast.success('Application approved'); qc.invalidateQueries(['applications']); setApproveTarget(null); setApproveNote('') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => rejectApplication(id, { organizerNote: rejectNote }),
    onSuccess: () => { toast.success('Application rejected'); qc.invalidateQueries(['applications']); setRejectTarget(null); setRejectNote('') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  })

  const applications = data?.applications || []
  const total = data?.total || 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Exhibitor Applications</h1>
          <p className={styles.sub}>{total} application{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t} className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
              onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search exhibitors..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={styles.card}>
        {isLoading ? <Skeleton count={5} height={60} style={{ marginBottom: 8 }} /> :
         !applications.length ? (
          <div className={styles.empty}>No {tab !== 'all' ? tab : ''} applications found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Exhibitor</th><th>Category</th>
                <th>Applied Date</th><th>Booth Pref.</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>
                    <div className={styles.exhibitorCell}>
                      <div className={styles.exAvatar}>
                        {app.exhibitorId?.avatar
                          ? <img src={app.exhibitorId.avatar} alt="" />
                          : app.exhibitorId?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className={styles.exName}>{app.exhibitorId?.company || app.exhibitorId?.name}</span>
                        <span className={styles.exEmail}>{app.exhibitorId?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.muted}>{app.category || '—'}</td>
                  <td className={styles.muted}>{format(new Date(app.appliedAt), 'MMM d, yyyy')}</td>
                  <td className={styles.muted}>{app.boothPreference || '—'}</td>
                  <td><Badge variant={app.status}>{app.status}</Badge></td>
                  <td>
                    {app.status === 'pending' && (
                      <div className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.approveBtn}`}
                          onClick={() => setApproveTarget(app)}>Approve</button>
                        <button className={`${styles.actionBtn} ${styles.rejectBtn}`}
                          onClick={() => { setRejectTarget(app); setRejectNote('') }}>Reject</button>
                      </div>
                    )}
                    <button className={styles.actionBtn} style={{ marginTop: app.status === 'pending' ? 6 : 0, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', width: '100%', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-text-secondary)' }}
                      onClick={() => setDetailsTarget(app)}><Info size={13}/> View Details</button>
                    {app.status !== 'pending' && app.organizerNote && (
                      <span className={styles.noteText} title={app.organizerNote} style={{ marginTop: 6, display: 'block' }}>Has note</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approve modal */}
      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Application"
        footer={<>
          <Button variant="secondary" onClick={() => setApproveTarget(null)}>Cancel</Button>
          <Button variant="primary" loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate(approveTarget._id)}>Confirm Approval</Button>
        </>}>
        <p className={styles.modalText}>
          Approve <strong>{approveTarget?.exhibitorId?.company || approveTarget?.exhibitorId?.name}</strong>?
        </p>
        <div style={{ marginTop: 16 }}>
          <Input label="Note (optional)" placeholder="Add a welcome note..."
            value={approveNote} onChange={(e) => setApproveNote(e.target.value)} />
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Application"
        footer={<>
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate(rejectTarget._id)}>Confirm Rejection</Button>
        </>}>
        <p className={styles.modalText}>
          Reject <strong>{rejectTarget?.exhibitorId?.company || rejectTarget?.exhibitorId?.name}</strong>?
        </p>
        <div style={{ marginTop: 16 }}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Reason (shown to exhibitor)</label>
            <textarea className={styles.textarea} rows={3} placeholder="Explain the reason for rejection..."
              value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Details modal */}
      <Modal isOpen={!!detailsTarget} onClose={() => setDetailsTarget(null)} title="Application Details"
        footer={<Button variant="secondary" onClick={() => setDetailsTarget(null)}>Close</Button>}>
        {detailsTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={styles.exAvatar} style={{ width: 48, height: 48, fontSize: '1.25rem' }}>
                {detailsTarget.exhibitorId?.avatar
                  ? <img src={detailsTarget.exhibitorId.avatar} alt="" />
                  : detailsTarget.exhibitorId?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{detailsTarget.exhibitorId?.company || detailsTarget.exhibitorId?.name}</h3>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{detailsTarget.exhibitorId?.email}</p>
              </div>
            </div>
            
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Status</span>
                  <Badge variant={detailsTarget.status}>{detailsTarget.status}</Badge>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Applied Date</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{format(new Date(detailsTarget.appliedAt), 'PPP')}</span>
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Category & Industry</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{detailsTarget.category || 'Not specified'} {detailsTarget.exhibitorId?.industry && `(${detailsTarget.exhibitorId.industry})`}</span>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Company Description</span>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {detailsTarget.companyDescription || 'No description provided.'}
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Booth Preference</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{detailsTarget.boothPreference || 'Any'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Website</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {detailsTarget.exhibitorId?.website ? (
                      <a href={detailsTarget.exhibitorId.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {detailsTarget.exhibitorId.website.replace(/^https?:\/\//, '')} <ExternalLink size={12}/>
                      </a>
                    ) : 'Not specified'}
                  </span>
                </div>
              </div>
              
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Special Requirements</span>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {detailsTarget.specialRequirements || 'None'}
                </p>
              </div>
              
              {detailsTarget.organizerNote && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Organizer Note</span>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    "{detailsTarget.organizerNote}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
