import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isPast } from 'date-fns'
import { motion } from 'framer-motion'
import { Clock, Mic2, Users, Calendar, Plus, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { listMyRegistrations } from '../../api/registration.api'
import { listSessionsByExpo } from '../../api/session.api'
import { listMyBookings, bookSession, cancelBooking } from '../../api/booking.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './AttSchedulePage.module.css'

function ExpoSchedule({ expo, bookedSessionIds, onBook, onCancel, bookingPending }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sessions', expo._id],
    queryFn: () => listSessionsByExpo(expo._id).then(r => r.data.data),
  })

  const sessions = (data?.sessions || []).filter(s => s.status !== 'Cancelled')

  if (isLoading) return <Skeleton count={3} height={64} style={{ marginBottom: 6 }} />
  if (!sessions.length) return (
    <div className={styles.noSessions}>
      <Clock size={14} /> No sessions scheduled yet
    </div>
  )

  return (
    <div className={styles.sessionList}>
      {sessions.map(s => {
        const booked = bookedSessionIds.has(s._id)
        const ended = s.status === 'Ended' || isPast(new Date(s.endTime))
        const full = s.capacity > 0 && s.bookedCount >= s.capacity && !booked

        return (
          <div key={s._id} className={`${styles.sessionRow} ${booked ? styles.bookedRow : ''}`}>
            <div className={styles.timeBlock}>
              <span className={styles.sessionDate}>{format(new Date(s.startTime), 'MMM d')}</span>
              <span className={styles.sessionTime}>{format(new Date(s.startTime), 'h:mm a')}</span>
              <span className={styles.sessionEnd}>{format(new Date(s.endTime), 'h:mm a')}</span>
            </div>

            <div className={styles.sessionInfo}>
              <div className={styles.sessionTitle}>
                {booked && <CheckCircle2 size={14} className={styles.checkIcon} />}
                {s.title}
              </div>
              <div className={styles.sessionMeta}>
                {s.speakerName && <span><Mic2 size={11} />{s.speakerName}</span>}
                {s.stageId?.name && <span className={styles.stage}>{s.stageId.name}</span>}
                {s.capacity > 0 && (
                  <span className={styles.capacity}>
                    <Users size={11} />{s.bookedCount}/{s.capacity}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.sessionRight}>
              <Badge variant={s.status.toLowerCase()}>{s.status}</Badge>
              {!ended && (
                booked ? (
                  <button
                    className={styles.cancelBtn}
                    onClick={() => onCancel(s._id)}
                    disabled={bookingPending === s._id}
                  >
                    {bookingPending === s._id ? '...' : 'Cancel'}
                  </button>
                ) : (
                  <button
                    className={`${styles.bookBtn} ${full ? styles.fullBtn : ''}`}
                    onClick={() => !full && onBook(s._id, expo._id)}
                    disabled={full || bookingPending === s._id}
                  >
                    {bookingPending === s._id ? '...' : full ? 'Full' : 'Book'}
                  </button>
                )
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AttSchedulePage() {
  const qc = useQueryClient()
  const [bookingPending, setBookingPending] = useState(null)

  const { data: regsData, isLoading: regsLoading } = useQuery({
    queryKey: ['registrations', 'my'],
    queryFn: () => listMyRegistrations().then(r => r.data.data),
  })

  const { data: booksData } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => listMyBookings().then(r => r.data.data),
  })

  const registrations = (regsData?.registrations || []).filter(r => r.expoId)
  const bookedSessionIds = new Set(
    (booksData?.bookings || []).map(b => b.sessionId?._id || b.sessionId)
  )

  const handleBook = async (sessionId, expoId) => {
    setBookingPending(sessionId)
    try {
      await bookSession(sessionId, expoId)
      toast.success('Session booked!')
      qc.invalidateQueries(['bookings', 'my'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book')
    } finally {
      setBookingPending(null)
    }
  }

  const handleCancel = async (sessionId) => {
    setBookingPending(sessionId)
    try {
      await cancelBooking(sessionId)
      toast.success('Booking cancelled')
      qc.invalidateQueries(['bookings', 'my'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setBookingPending(null)
    }
  }

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={styles.title}>My Schedule</h1>
          <p className={styles.sub}>Sessions from your registered expos</p>
        </div>
        <Link to="/attendee/bookings" className={styles.bookingsBtn}>
          View My Bookings →
        </Link>
      </motion.div>

      {regsLoading ? (
        <Skeleton count={4} height={120} borderRadius={14} style={{ marginBottom: 16 }} />
      ) : !registrations.length ? (
        <div className={styles.empty}>
          <Calendar size={48} />
          <h3>No registered expos</h3>
          <p>Register for an expo to see and book its sessions</p>
          <Link to="/attendee/events" className={styles.emptyBtn}>
            <Plus size={14} /> Browse Events
          </Link>
        </div>
      ) : (
        <div className={styles.expoList}>
          {registrations.map((reg, i) => (
            <motion.div
              key={reg._id}
              className={styles.expoCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className={styles.expoHeader}>
                <div className={styles.expoBanner}>
                  {reg.expoId?.bannerImage
                    ? <img src={reg.expoId.bannerImage} alt="" />
                    : reg.expoId?.name?.[0]
                  }
                </div>
                <div className={styles.expoInfo}>
                  <h2 className={styles.expoName}>{reg.expoId?.name}</h2>
                  <p className={styles.expoDates}>
                    {reg.expoId?.startDate && format(new Date(reg.expoId.startDate), 'MMM d')}
                    {' – '}
                    {reg.expoId?.endDate && format(new Date(reg.expoId.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant={reg.expoId?.status?.toLowerCase()}>{reg.expoId?.status}</Badge>
              </div>

              <ExpoSchedule
                expo={reg.expoId}
                bookedSessionIds={bookedSessionIds}
                onBook={handleBook}
                onCancel={handleCancel}
                bookingPending={bookingPending}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
