import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { addMessage, setUnreadCount } from '../app/slices/messageSlice'
import useSocket from './useSocket'
import { getUnreadCount } from '../api/message.api'

/**
 * Listens for real-time message:receive events and updates Redux store.
 * Also fetches initial unread message count on mount.
 */
export default function useMessages() {
  const dispatch = useDispatch()
  const { socket } = useSocket()
  const activeConversationId = useSelector((s) => s.messages.activeConversationId)

  // Fetch initial unread count
  useEffect(() => {
    getUnreadCount()
      .then((res) => dispatch(setUnreadCount(res.data.data?.count || 0)))
      .catch(() => {})
  }, [dispatch])

  useEffect(() => {
    if (!socket) return

    const onReceive = (message) => {
      const isCurrent = message.conversationId === activeConversationId
      dispatch(addMessage({ conversationId: message.conversationId, message, isCurrent }))

      // Show toast only if not currently viewing that conversation
      if (message.conversationId !== activeConversationId) {
        const senderName = message.senderId?.name || 'Someone'
        toast(`💬 ${senderName}: ${message.content.substring(0, 60)}`, {
          style: {
            background: '#1a1d28',
            color: '#f0f0f5',
            border: '1px solid #252836',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
          duration: 4000,
        })
      }
    }

    socket.on('message:receive', onReceive)
    return () => socket.off('message:receive', onReceive)
  }, [socket, dispatch, activeConversationId])
}
