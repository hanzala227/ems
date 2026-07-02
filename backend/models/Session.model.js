const mongoose = require('mongoose')

const SessionSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true, maxlength: 200 },
  description:  { type: String, default: '', maxlength: 2000 },
  expoId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  stageId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Stage', required: true },
  speakerName:  { type: String, default: '', maxlength: 100 },
  speakerBio:   { type: String, default: '', maxlength: 1000 },
  speakerAvatar:{ type: String, default: null },
  startTime:    { type: Date, required: true },
  endTime:      { type: Date, required: true },
  capacity:     { type: Number, default: 0, min: 0 },
  bookedCount:  { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['Scheduled', 'Live', 'Ended', 'Cancelled'],
    default: 'Scheduled',
  },
}, { timestamps: true })

SessionSchema.index({ expoId: 1 })
SessionSchema.index({ stageId: 1 })
SessionSchema.index({ expoId: 1, startTime: 1 })
SessionSchema.index({ status: 1 })

module.exports = mongoose.model('Session', SessionSchema)
