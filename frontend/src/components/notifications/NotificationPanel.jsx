import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { formatDistanceToNow } from 'date-fns'
import { CheckCheck, X } from 'lucide-react'
import { markAllRead as markAllReadSlice } from '../../app/slices/notificationSlice'
import * as notifApi from '../../api/notification.api'
import styles from './NotificationPanel.module.css'

const TYPE_ICON = {
  new_application: '📋',
  application_approved: '✅',
  application_rejected: '❌',
  booth_assigned: '🏪',
  booth_selected: '📍',
  new_message: '💬',
  session_live: '🎙️',
  session_cancelled: '🚫',
  default: '🔔',
}

export default function NotificationPanel({ onClose }) {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const user = useSelector(s => s.auth.user)
  const panelRef = useRef(null)

  const { data } = useQuery({
    queryKey: ['notifications', 'panel'],
    queryFn: () => notifApi.getNotifications({ limit: 10 }).then(r => r.data.data),
  })

  const markAllMutation = useMutation({
    mutationFn: notifApi.markAllRead,
    onSuccess: () => {
      dispatch(markAllReadSlice())
      qc.invalidateQueries(['notifications'])
    },
  })

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0
  const dashBase = `/${user?.role}`

  return (
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Notifications {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}</span>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button className={styles.markAllBtn} onClick={() => markAllMutation.mutate()} title="Mark all read">
              <CheckCheck size={14} />
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose}><X size={14} /></button>
        </div>
      </div>

      <div className={styles.list}>
        {!notifications.length ? (
          <div className={styles.empty}>🔔 No notifications yet</div>
        ) : notifications.map(n => (
          <div key={n._id} className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}>
            <span className={styles.icon}>{TYPE_ICON[n.type] || TYPE_ICON.default}</span>
            <div className={styles.content}>
              <p className={styles.itemTitle}>{n.title}</p>
              <p className={styles.itemMsg}>{n.message}</p>
              <span className={styles.time}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Link to={`${dashBase}/notifications`} className={styles.viewAll} onClick={onClose}>
          View all notifications →
        </Link>
      </div>
    </div>
  )
}
