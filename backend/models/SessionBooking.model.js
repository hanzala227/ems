const mongoose = require('mongoose')

const SessionBookingSchema = new mongoose.Schema({
  sessionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  attendeeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  bookedAt:    { type: Date, default: Date.now },
}, { timestamps: true })

SessionBookingSchema.index({ sessionId: 1, attendeeId: 1 }, { unique: true })
SessionBookingSchema.index({ attendeeId: 1 })
SessionBookingSchema.index({ expoId: 1 })

module.exports = mongoose.model('SessionBooking', SessionBookingSchema)
