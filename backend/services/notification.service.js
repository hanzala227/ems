const Notification = require('../models/Notification.model')

/**
 * Create a notification in DB and emit via Socket.io to the recipient's personal room.
 * @param {string} recipientId
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {string|null} link
 * @param {import('socket.io').Server|null} io
 */
const createAndEmit = async (recipientId, type, title, message, link = null, io = null) => {
  try {
    const notification = await Notification.create({ recipientId, type, title, message, link })
    if (io) {
      io.to(`user:${recipientId}`).emit('notification:new', notification)
    }
    return notification
  } catch (err) {
    console.error('Notification service error:', err.message)
    return null
  }
}

module.exports = { createAndEmit }
