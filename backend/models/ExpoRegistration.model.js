const mongoose = require('mongoose')

const ExpoRegistrationSchema = new mongoose.Schema({
  expoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  attendeeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['registered', 'cancelled'],
    default: 'registered',
  },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true })

ExpoRegistrationSchema.index({ expoId: 1, attendeeId: 1 }, { unique: true })
ExpoRegistrationSchema.index({ attendeeId: 1 })
ExpoRegistrationSchema.index({ expoId: 1 })

module.exports = mongoose.model('ExpoRegistration', ExpoRegistrationSchema)
