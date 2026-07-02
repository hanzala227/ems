const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:     { type: String, required: true, maxlength: 2000 },
  isRead:      { type: Boolean, default: false },
}, { timestamps: true })

MessageSchema.index({ conversationId: 1, createdAt: -1 })
MessageSchema.index({ senderId: 1 })
MessageSchema.index({ recipientId: 1 })

module.exports = mongoose.model('Message', MessageSchema)
