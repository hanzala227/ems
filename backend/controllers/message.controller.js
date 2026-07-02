const Message = require('../models/Message.model')
const User = require('../models/User.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')

// Build a consistent conversationId from two user IDs
const buildConversationId = (idA, idB) => [idA.toString(), idB.toString()].sort().join(':')

// GET /api/messages/conversations
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString()

  // Aggregate unique conversations
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: req.user._id },
          { recipientId: req.user._id },
        ],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$isRead', false] }, { $eq: ['$recipientId', req.user._id] }] },
              1, 0,
            ],
          },
        },
      },
    },
    {
      $sort: { 'lastMessage.createdAt': -1 },
    },
    {
      $limit: 50,
    },
  ])

  // Populate the other participant
  const populated = await Promise.all(
    conversations.map(async (conv) => {
      const msg = conv.lastMessage
      const otherUserId = msg.senderId.toString() === userId ? msg.recipientId : msg.senderId
      const otherUser = await User.findById(otherUserId).select('name email avatar role company')
      return {
        conversationId: conv._id,
        otherUser,
        lastMessage: msg,
        unreadCount: conv.unreadCount,
      }
    }),
  )

  ok(res, { conversations: populated })
})

// GET /api/messages/:conversationId?page=1
const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query
  const { conversationId } = req.params
  const userId = req.user._id.toString()

  // Verify user is a participant
  const isParticipant = conversationId.includes(userId)
  if (!isParticipant) throw new ApiError(403, 'Not a participant in this conversation')

  const skip = (Number(page) - 1) * Number(limit)
  const [messages, total] = await Promise.all([
    Message.find({ conversationId })
      .populate('senderId', 'name avatar role company')
      .populate('recipientId', 'name avatar role company')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Message.countDocuments({ conversationId }),
  ])

  ok(res, { messages, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
})

// POST /api/messages — REST fallback (also used by socket)
const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, content } = req.body
  if (!recipientId || !content?.trim()) throw new ApiError(400, 'recipientId and content are required')

  const recipient = await User.findById(recipientId)
  if (!recipient) throw new ApiError(404, 'Recipient not found')

  const conversationId = buildConversationId(req.user._id, recipientId)

  const message = await Message.create({
    conversationId,
    senderId: req.user._id,
    recipientId,
    content: content.trim(),
  })

  const populated = await Message.findById(message._id)
    .populate('senderId', 'name avatar role company')
    .populate('recipientId', 'name avatar role company')

  // Emit via socket if available
  const io = req.app.locals.io
  if (io) {
    io.to(`user:${recipientId}`).emit('message:receive', populated)
  }

  created(res, { message: populated }, 'Message sent')
})

// PATCH /api/messages/:conversationId/read
const markConversationRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params
  const userId = req.user._id.toString()

  if (!conversationId.includes(userId)) throw new ApiError(403, 'Not a participant')

  const result = await Message.updateMany(
    { conversationId, recipientId: req.user._id, isRead: false },
    { isRead: true },
  )

  ok(res, { modified: result.modifiedCount }, 'Conversation marked as read')
})

// GET /api/messages/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({ recipientId: req.user._id, isRead: false })
  ok(res, { count })
})

// GET /api/messages/search?q=xyz
const searchMessages = asyncHandler(async (req, res) => {
  const { q } = req.query
  if (!q) return ok(res, { messages: [] })

  const messages = await Message.find({
    $or: [{ senderId: req.user._id }, { recipientId: req.user._id }],
    content: { $regex: q, $options: 'i' },
  })
    .populate('senderId', 'name avatar role company')
    .populate('recipientId', 'name avatar role company')
    .sort({ createdAt: -1 })
    .limit(50)

  ok(res, { messages })
})

module.exports = { getConversations, getMessages, sendMessage, markConversationRead, getUnreadCount, searchMessages, buildConversationId }
