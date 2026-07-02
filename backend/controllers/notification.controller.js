const Notification = require('../models/Notification.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok } = require('../utils/ApiResponse')

// GET /api/notifications?page=1&limit=20&unreadOnly=false
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query
  const filter = { recipientId: req.user._id }
  if (unreadOnly === 'true') filter.isRead = false

  const skip = (Number(page) - 1) * Number(limit)
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: req.user._id, isRead: false }),
  ])

  ok(res, { notifications, total, unreadCount, page: Number(page), pages: Math.ceil(total / Number(limit)) })
})

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipientId: req.user._id })
  if (!notification) throw new ApiError(404, 'Notification not found')
  notification.isRead = true
  await notification.save()
  ok(res, { notification }, 'Notification marked as read')
})

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { isRead: true })
  ok(res, null, 'All notifications marked as read')
})

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipientId: req.user._id })
  ok(res, null, 'Notification deleted')
})

// GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipientId: req.user._id, isRead: false })
  ok(res, { count })
})

module.exports = { getNotifications, markRead, markAllRead, deleteNotification, getUnreadCount }
