import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { MapPin, Calendar, Users, Map, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { getExpo } from '../../api/expo.api'
import { registerForExpo, listMyRegistrations, cancelRegistration } from '../../api/registration.api'
import { listSessionsByExpo } from '../../api/session.api'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import styles from './EventDetailPage.module.css'

export default function EventDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')

  const { data: expoData, isLoading } = useQuery({
    queryKey: ['expo', id],
    queryFn: () => getExpo(id).then(r => r.data.data),
  })

  const { data: regsData } = useQuery({
    queryKey: ['registrations', 'my'],
    queryFn: () => listMyRegistrations().then(r => r.data.data),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => listSessionsByExpo(id).then(r => r.data.data),
    enabled: tab === 'schedule',
  })

  const isRegistered = (regsData?.registrations || []).some(r => (r.expoId?._id || r.expoId) === id)

  const registerMutation = useMutation({
    mutationFn: () => registerForExpo(id),
    onSuccess: () => { toast.success('Successfully registered!'); qc.invalidateQueries(['registrations', 'my']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelRegistration(id),
    onSuccess: () => { toast.success('Registration cancelled'); qc.invalidateQueries(['registrations', 'my']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel'),
  })

  const expo = expoData?.expo
  const sessions = sessionsData?.sessions || []

  if (isLoading) return <div className={styles.page}><Skeleton count={6} height={40} style={{ marginBottom: 12 }} /></div>
  if (!expo) return <div className={styles.page}><p>Event not found.</p></div>

  return (
    <div className={styles.page}>
      {/* Banner */}
      <div className={styles.banner} style={{ backgroundImage: expo.bannerImage ? `url(${expo.bannerImage})` : undefined }}>
        {!expo.bannerImage && <div className={styles.bannerFallback}>{expo.name[0]}</div>}
        <div className={styles.overlay}>
          <div>
            <Badge variant={expo.status.toLowerCase()}>{expo.status}</Badge>
            <h1 className={styles.expoTitle}>{expo.name}</h1>
            {expo.theme && <p className={styles.expoTheme}>{expo.theme}</p>}
          </div>
          <div>
            {isRegistered ? (
              <div className={styles.regRow}>
                <span className={styles.registeredBadge}>✓ Registered</span>
                <Button variant="secondary" size="sm" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="primary" loading={registerMutation.isPending} onClick={() => registerMutation.mutate()}>
                Register Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className={styles.metaRow}>
        <div className={styles.metaItem}><Calendar size={15} />{format(new Date(expo.startDate), 'MMM d')} – {format(new Date(expo.endDate), 'MMM d, yyyy')}</div>
        {expo.location?.city && <div className={styles.metaItem}><MapPin size={15} />{expo.location.city}, {expo.location.country}</div>}
        <div className={styles.metaItem}><Users size={15} />{expo.registeredCount || 0} registered</div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['overview', 'schedule'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        {isRegistered && (
          <>
            <Link to={`/attendee/events/${id}/floor-plan`} className={styles.tabLink}><Map size={14}/> Floor Plan</Link>
          </>
        )}
      </div>

      {tab === 'overview' && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>About this Event</h2>
          <p className={styles.description}>{expo.description}</p>
          {expo.category && <p className={styles.catTag}>{expo.category}</p>}
        </div>
      )}

      {tab === 'schedule' && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Session Schedule</h2>
          {!sessions.length ? (
            <p className={styles.emptyTxt}>No sessions scheduled yet.</p>
          ) : (
            <div className={styles.sessionList}>
              {sessions.map(s => (
                <div key={s._id} className={styles.sessionItem}>
                  <div className={styles.sessionTime}>
                    <Clock size={14} />
                    <span>{format(new Date(s.startTime), 'MMM d · h:mm a')}</span>
                  </div>
                  <div className={styles.sessionInfo}>
                    <span className={styles.sessionTitle}>{s.title}</span>
                    {s.speakerName && <span className={styles.sessionSpeaker}>{s.speakerName}</span>}
                    {s.stageId?.name && <span className={styles.sessionStage}>{s.stageId.name}</span>}
                  </div>
                  <Badge variant={s.status.toLowerCase()}>{s.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
