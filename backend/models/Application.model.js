const mongoose = require('mongoose')

const ApplicationSchema = new mongoose.Schema({
  expoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  companyDescription: { type: String, default: '', maxlength: 2000 },
  category:           { type: String, default: '' },
  boothPreference:    { type: String, default: '' },
  specialRequirements: { type: String, default: '', maxlength: 1000 },
  documents: [{
    url:      { type: String },
    publicId: { type: String },
    name:     { type: String },
    _id: false,
  }],
  organizerNote: { type: String, default: '', maxlength: 1000 },
  appliedAt:     { type: Date, default: Date.now },
}, { timestamps: true })

ApplicationSchema.index({ expoId: 1 })
ApplicationSchema.index({ exhibitorId: 1 })
ApplicationSchema.index({ status: 1 })
ApplicationSchema.index({ expoId: 1, exhibitorId: 1 })
ApplicationSchema.index({ expoId: 1, status: 1 })

module.exports = mongoose.model('Application', ApplicationSchema)
