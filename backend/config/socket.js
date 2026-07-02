const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const cookie = require('cookie')
const User = require('../models/User.model')
const Message = require('../models/Message.model')
const { createAndEmit } = require('../services/notification.service')

// Track online users: userId -> Set of socket IDs
const onlineUsers = new Map()

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // ── JWT Authentication Middleware ──────────────────────────
  io.use(async (socket, next) => {
    try {
      let token = null

      // Try cookie first
      if (socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie)
        token = cookies.token
      }

      // Fallback to auth header
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token
      }

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('_id name email role avatar company')

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'))
      }

      socket.data.user = user
      next()
    } catch (err) {
      next(new Error('Invalid token: ' + err.message))
    }
  })

  // ── Connection Handler ─────────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.data.user
    const userId = user._id.toString()

    console.log(`🔌 Socket connected: ${socket.id} | User: ${user.name} (${user.role})`)

    // Join personal room
    socket.join(`user:${userId}`)

    // Track online status
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
    onlineUsers.get(userId).add(socket.id)

    // Broadcast online status to all connected users
    io.emit('user:online', { userId, online: true })


    // ── Messaging ──────────────────────────────────────────
    socket.on('message:send', async ({ recipientId, content, conversationId }) => {
      try {
        if (!recipientId || !content?.trim()) return

        // Build consistent conversationId
        const convId = conversationId || [userId, recipientId].sort().join(':')

        const message = await Message.create({
          conversationId: convId,
          senderId: userId,
          recipientId,
          content: content.trim(),
        })

        const populated = await Message.findById(message._id)
          .populate('senderId', 'name avatar role company')
          .populate('recipientId', 'name avatar role company')

        // Emit to recipient's personal room
        io.to(`user:${recipientId}`).emit('message:receive', populated)

        // Confirm back to sender's current tab
        socket.emit('message:sent', populated)

        // Broadcast to sender's OTHER tabs
        socket.broadcast.to(`user:${userId}`).emit('message:receive', populated)

        // Notify recipient if not in the same conversation window
        await createAndEmit(
          recipientId,
          'new_message',
          `New message from ${user.name}`,
          content.trim().substring(0, 100),
          null,
          io,
        )
      } catch (err) {
        console.error('Socket message:send error:', err.message)
        socket.emit('message:error', { error: 'Failed to send message' })
      }
    })

    // ── Typing indicators ──────────────────────────────────
    socket.on('message:typing', ({ recipientId, conversationId }) => {
      if (!recipientId) return
      io.to(`user:${recipientId}`).emit('message:typing', {
        senderId: userId,
        senderName: user.name,
        conversationId,
      })
    })

    socket.on('message:typing_stop', ({ recipientId, conversationId }) => {
      if (!recipientId) return
      io.to(`user:${recipientId}`).emit('message:typing_stop', {
        senderId: userId,
        conversationId,
      })
    })

    // ── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} | ${user.name} | Reason: ${reason}`)

      const sockets = onlineUsers.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          onlineUsers.delete(userId)
          io.emit('user:online', { userId, online: false })
        }
      }
    })
  })

  return io
}

const isUserOnline = (userId) => onlineUsers.has(userId.toString())
const getOnlineUsers = () => Array.from(onlineUsers.keys())

module.exports = { initSocket, isUserOnline, getOnlineUsers }
