import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { getExpo, changeExpoStatus, deleteExpo, updateExpo } from '../../api/expo.api'
import { listApplicationsByExpo } from '../../api/application.api'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import Modal from '../../components/ui/Modal/Modal'
import Input from '../../components/ui/Input/Input'
import { Upload, X } from 'lucide-react'
import styles from './ExpoDetailPage.module.css'

const TABS = ['overview', 'applications', 'floor-plan', 'schedule']

export default function ExpoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)

  const { data: expoData, isLoading } = useQuery({
    queryKey: ['expo', id],
    queryFn: () => getExpo(id).then(r => r.data.data),
  })

  const { data: appsData } = useQuery({
    queryKey: ['applications', id, 'all'],
    queryFn: () => listApplicationsByExpo(id, { limit: 5 }).then(r => r.data.data),
    enabled: activeTab === 'applications',
  })

  const statusMutation = useMutation({
    mutationFn: (status) => changeExpoStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['expo', id]) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpo(id),
    onSuccess: () => { toast.success('Expo deleted'); navigate('/organizer/expos') },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (fd) => updateExpo(id, fd),
    onSuccess: () => { toast.success('Expo updated'); qc.invalidateQueries(['expo', id]); setShowEdit(false) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const openEdit = () => {
    if (!expoData?.expo) return
    const e = expoData.expo
    setEditForm({
      name: e.name,
      description: e.description,
      theme: e.theme || '',
      category: e.category || '',
      startDate: new Date(e.startDate).toISOString().slice(0, 16),
      endDate: new Date(e.endDate).toISOString().slice(0, 16),
      capacity: e.capacity || 0,
      address: e.location?.address || '',
      city: e.location?.city || '',
      country: e.location?.country || ''
    })
    setBannerFile(null)
    setShowEdit(true)
  }

  const handleEditSubmit = () => {
    if (!editForm) return
    const fd = new FormData()
    fd.append('name', editForm.name)
    fd.append('description', editForm.description)
    if (editForm.theme) fd.append('theme', editForm.theme)
    if (editForm.category) fd.append('category', editForm.category)
    fd.append('startDate', editForm.startDate)
    fd.append('endDate', editForm.endDate)
    if (editForm.capacity) fd.append('capacity', editForm.capacity)
    fd.append('location', JSON.stringify({ address: editForm.address, city: editForm.city, country: editForm.country }))
    if (bannerFile) fd.append('banner', bannerFile)
    updateMutation.mutate(fd)
  }

  const expo = expoData?.expo

  if (isLoading) return <div className={styles.page}><Skeleton count={6} height={40} style={{ marginBottom: 12 }} /></div>
  if (!expo) return <div className={styles.page}><p>Expo not found.</p></div>

  return (
    <div className={styles.page}>
      {/* Banner */}
      <div className={styles.banner} style={{ backgroundImage: expo.bannerImage ? `url(${expo.bannerImage})` : undefined }}>
        {!expo.bannerImage && <div className={styles.bannerFallback}>{expo.name[0].toUpperCase()}</div>}
        <div className={styles.bannerOverlay}>
          <div className={styles.bannerContent}>
            <Badge variant={expo.status.toLowerCase()}>{expo.status}</Badge>
            <h1 className={styles.expoTitle}>{expo.name}</h1>
            {expo.theme && <p className={styles.expoTheme}>{expo.theme}</p>}
            <p className={styles.expoDates}>
              {format(new Date(expo.startDate), 'MMM d')} – {format(new Date(expo.endDate), 'MMM d, yyyy')}
              {expo.location?.city && ` · ${expo.location.city}, ${expo.location.country}`}
            </p>
          </div>
          <div className={styles.bannerActions}>
            <select
              className={styles.statusSelect}
              value={expo.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
            >
              {['Draft','Published','Live','Ended','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{expo.capacity || '∞'}</span>
          <span className={styles.statLbl}>Capacity</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{expo.registeredCount || 0}</span>
          <span className={styles.statLbl}>Registered</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{expo.category || '—'}</span>
          <span className={styles.statLbl}>Category</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t} className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Description</h2>
            <Button variant="secondary" size="sm" onClick={openEdit}>Edit Details</Button>
          </div>
          <p className={styles.description}>{expo.description}</p>
          {expo.location?.address && (
            <div className={styles.locationBlock}>
              <strong>Address:</strong> {expo.location.address}, {expo.location.city}, {expo.location.country}
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Applications</h2>
            <Link to={`/organizer/expos/${id}/applications`} className={styles.viewAll}>View All →</Link>
          </div>
          {!appsData?.applications?.length ? (
            <p className={styles.emptyText}>No applications yet.</p>
          ) : (
            <table className={styles.appTable}>
              <thead><tr><th>Exhibitor</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {appsData.applications.map(app => (
                  <tr key={app._id}>
                    <td>{app.exhibitorId?.company || app.exhibitorId?.name}</td>
                    <td className={styles.muted}>{app.category || '—'}</td>
                    <td><Badge variant={app.status}>{app.status}</Badge></td>
                    <td>
                      <Link to={`/organizer/expos/${id}/applications`} className={styles.viewAll}>Manage</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'floor-plan' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Floor Plan</h2>
            <Link to={`/organizer/expos/${id}/floor-plan`} className={styles.viewAll}>Open Editor →</Link>
          </div>
          <p className={styles.emptyText}>Click "Open Editor" to manage halls and booths for this expo.</p>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Schedule</h2>
            <Link to={`/organizer/expos/${id}/schedule`} className={styles.viewAll}>Manage Schedule →</Link>
          </div>
          <p className={styles.emptyText}>Click "Manage Schedule" to add sessions and stages.</p>
        </div>
      )}

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Expo"
        footer={<>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}>Delete</Button>
        </>}>
        <p className={styles.muted}>Delete <strong style={{ color: 'var(--color-text-primary)' }}>{expo.name}</strong>? This cannot be undone.</p>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Expo"
        footer={<>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button variant="primary" loading={updateMutation.isPending} onClick={handleEditSubmit}>Save Changes</Button>
        </>}>
        {editForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Name *" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Category" value={editForm.category} onChange={e => setEditForm(f => ({...f, category: e.target.value}))} />
              <Input label="Theme" value={editForm.theme} onChange={e => setEditForm(f => ({...f, theme: e.target.value}))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Description *</label>
              <textarea style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-primary)', fontSize: '0.875rem', padding: '10px 14px', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                rows={3} value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Start Date *" type="datetime-local" value={editForm.startDate} onChange={e => setEditForm(f => ({...f, startDate: e.target.value}))} />
              <Input label="End Date *" type="datetime-local" value={editForm.endDate} onChange={e => setEditForm(f => ({...f, endDate: e.target.value}))} />
            </div>
            <Input label="Capacity (0=unlimited)" type="number" value={editForm.capacity} onChange={e => setEditForm(f => ({...f, capacity: Number(e.target.value)}))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Input label="Address" value={editForm.address} onChange={e => setEditForm(f => ({...f, address: e.target.value}))} />
              <Input label="City" value={editForm.city} onChange={e => setEditForm(f => ({...f, city: e.target.value}))} />
              <Input label="Country" value={editForm.country} onChange={e => setEditForm(f => ({...f, country: e.target.value}))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Update Banner Image</label>
              {bannerFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-primary)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bannerFile.name}
                  </span>
                  <button type="button" onClick={() => setBannerFile(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--color-bg-elevated)', border: '2px dashed var(--color-border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Upload size={24} style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>Click to browse image</span>
                  <input type="file" accept="image/*" hidden onChange={e => setBannerFile(e.target.files?.[0])} />
                </label>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
