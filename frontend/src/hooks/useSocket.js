import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'
import api from '../api/axios'

let socketInstance = null

/**
 * Singleton socket.io client.
 * Connects once when user is authenticated, disconnects on logout.
 * Returns the socket instance and a helper to check connection.
 */
export default function useSocket() {
  const { isAuthenticated, isLoading } = useSelector((s) => s.auth)
  const socketRef = useRef(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [activeSocket, setActiveSocket] = useState(socketInstance)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
      setOnlineUsers(new Set())
      setActiveSocket(null)
      return
    }

    if (socketInstance?.connected) {
      socketRef.current = socketInstance
      setActiveSocket(socketInstance)
      return
    }

    // Create new connection — credentials (cookie) sent automatically
    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', async () => {
      console.log('✅ Socket connected:', socket.id)
      try {
        const res = await api.get('/messages/online-users')
        setOnlineUsers(new Set(res.data.data.onlineUserIds))
      } catch (err) {
        console.error('Failed to fetch online users:', err)
      }
    })

    socket.on('connect_error', (err) => {
      // Don't spam console with common auth errors
      if (!['Authentication required', 'User not found or inactive', 'Invalid token'].includes(err.message)) {
        console.warn('⚠️ Socket connect error:', err.message)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
    })

    socket.on('user:online', ({ userId, online }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        if (online) {
          next.add(userId)
        } else {
          next.delete(userId)
        }
        return next
      })
    })

    socketInstance = socket
    socketRef.current = socket
    setActiveSocket(socket)

    return () => {
      // Don't disconnect on component unmount — keep singleton alive
    }
  }, [isAuthenticated, isLoading])

  const getSocket = useCallback(() => socketRef.current || socketInstance, [])
  const isUserOnline = useCallback((userId) => onlineUsers.has(userId?.toString()), [onlineUsers])

  return { socket: activeSocket || socketRef.current || socketInstance, getSocket, onlineUsers, isUserOnline }
}

export { socketInstance }
