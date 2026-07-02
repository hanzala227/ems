const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, required: true },
  title:   { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 1000 },
  link:    { type: String, default: null },
  isRead:  { type: Boolean, default: false },
}, { timestamps: true })

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', NotificationSchema)
