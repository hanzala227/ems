import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Clock, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { listMyBookings, cancelBooking } from '../../api/booking.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './BookingsPage.module.css'

export default function BookingsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => listMyBookings().then(r => r.data.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (sessionId) => cancelBooking(sessionId),
    onSuccess: () => { toast.success('Booking cancelled'); qc.invalidateQueries(['bookings', 'my']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const bookings = data?.bookings || []

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Session Bookings</h1>
      <p className={styles.sub}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>

      {isLoading ? <Skeleton count={4} height={80} style={{ marginBottom: 8 }} /> :
       !bookings.length ? (
        <div className={styles.empty}>
          <Clock size={40} />
          <h3>No bookings yet</h3>
          <p>Browse events and book sessions to attend</p>
        </div>
      ) : (
        <div className={styles.list}>
          {bookings.map(b => (
            <div key={b._id} className={styles.bookingCard}>
              <div className={styles.timeBlock}>
                <span className={styles.date}>{b.sessionId?.startTime ? format(new Date(b.sessionId.startTime), 'MMM d') : '—'}</span>
                <span className={styles.time}>{b.sessionId?.startTime ? format(new Date(b.sessionId.startTime), 'h:mm a') : ''}</span>
              </div>
              <div className={styles.info}>
                <span className={styles.sessionTitle}>{b.sessionId?.title || 'Session'}</span>
                {b.sessionId?.speakerName && <span className={styles.speaker}>Speaker: {b.sessionId.speakerName}</span>}
                {b.sessionId?.stageId?.name && <span className={styles.stage}>{b.sessionId.stageId.name}</span>}
                <span className={styles.expoName}>{b.expoId?.name}</span>
              </div>
              <div className={styles.right}>
                <Badge variant={b.sessionId?.status?.toLowerCase() || 'scheduled'}>{b.sessionId?.status || 'Scheduled'}</Badge>
                {b.sessionId?.status !== 'Ended' && b.sessionId?.status !== 'Cancelled' && (
                  <button className={styles.cancelBtn}
                    onClick={() => cancelMutation.mutate(b.sessionId?._id || b.sessionId)}
                    title="Cancel booking">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
