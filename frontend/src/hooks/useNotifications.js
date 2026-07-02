import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'
import { addNotification, setUnreadCount } from '../app/slices/notificationSlice'
import useSocket from './useSocket'
import { getUnreadCount } from '../api/notification.api'

/**
 * Listens for real-time notification:new events and updates Redux store.
 * Also fetches initial unread count on mount.
 */
export default function useNotifications() {
  const dispatch = useDispatch()
  const { socket } = useSocket()

  // Fetch initial unread count
  useEffect(() => {
    getUnreadCount()
      .then((res) => dispatch(setUnreadCount(res.data.data?.count || 0)))
      .catch(() => {})
  }, [dispatch])

  useEffect(() => {
    if (!socket) return

    const handler = (notification) => {
      dispatch(addNotification(notification))

      // Show toast
      toast(notification.title, {
        icon: '🔔',
        style: {
          background: '#1a1d28',
          color: '#f0f0f5',
          border: '1px solid #252836',
          borderRadius: '10px',
          fontSize: '0.875rem',
        },
        duration: 5000,
      })
    }

    socket.on('notification:new', handler)
    return () => socket.off('notification:new', handler)
  }, [socket, dispatch])
}
