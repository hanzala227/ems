const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema({
  address: { type: String, default: '' },
  city:    { type: String, default: '' },
  country: { type: String, default: '' },
}, { _id: false })

const ExpoSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 5000 },
  theme:       { type: String, default: '', maxlength: 200 },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  location:    { type: locationSchema, default: () => ({}) },
  category:    { type: String, default: '' },
  bannerImage: { type: String, default: null },
  bannerPublicId: { type: String, default: null },
  capacity:    { type: Number, default: 0, min: 0 },
  registeredCount: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Live', 'Ended', 'Cancelled'],
    default: 'Draft',
  },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true })

ExpoSchema.index({ organizerId: 1 })
ExpoSchema.index({ status: 1 })
ExpoSchema.index({ startDate: 1, endDate: 1 })
ExpoSchema.index({ isDeleted: 1 })

module.exports = mongoose.model('Expo', ExpoSchema)
