import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { motion, AnimatePresence } from 'framer-motion'
import { markAllRead as markAllReadAction } from '../../app/slices/notificationSlice'
import * as notifApi from '../../api/notification.api'
import Button from '../../components/ui/Button/Button'
import styles from './NotificationsPage.module.css'

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

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const dispatch = useDispatch()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notifApi.getNotifications({ unreadOnly: filter === 'unread', limit: 50 })
      .then(r => r.data.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notifApi.markRead(id),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })

  const markAllMutation = useMutation({
    mutationFn: notifApi.markAllRead,
    onSuccess: () => {
      dispatch(markAllReadAction())
      qc.invalidateQueries(['notifications'])
      toast.success('All notifications marked as read')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => notifApi.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.sub}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {['all', 'unread'].map(t => (
          <button
            key={t}
            className={`${styles.tab} ${filter === t ? styles.activeTab : ''}`}
            onClick={() => setFilter(t)}
          >
            {t === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <Skeleton count={5} height={72} style={{ marginBottom: 8 }} />
        ) : !notifications.length ? (
          <div className={styles.empty}>
            <Bell size={40} />
            <p>No {filter === 'unread' ? 'unread ' : ''}notifications</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div
                key={n._id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
              >
                <span className={styles.typeIcon}>{TYPE_ICON[n.type] || TYPE_ICON.default}</span>
                <div className={styles.itemContent}>
                  <p className={styles.itemTitle}>{n.title}</p>
                  <p className={styles.itemMsg}>{n.message}</p>
                  <span className={styles.itemTime}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  {!n.isRead && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => markReadMutation.mutate(n._id)}
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => deleteMutation.mutate(n._id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
