const mongoose = require('mongoose')

const HallSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  expoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  floorNumber: { type: Number, default: 1 },
  rows:        { type: Number, required: true, min: 1, max: 50 },
  columns:     { type: Number, required: true, min: 1, max: 50 },
  description: { type: String, default: '', maxlength: 500 },
}, { timestamps: true })

HallSchema.index({ expoId: 1 })
HallSchema.index({ organizerId: 1 })

module.exports = mongoose.model('Hall', HallSchema)
