const mongoose = require('mongoose')

const BoothSchema = new mongoose.Schema({
  boothNumber:   { type: String, required: true },
  hallId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  expoId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  exhibitorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  status: {
    type: String,
    enum: ['available', 'reserved', 'occupied', 'pending', 'blocked'],
    default: 'available',
  },
  // Grid position (1-based row/col index within hall)
  row:     { type: Number, required: true },
  col:     { type: Number, required: true },
  // Canvas position (px, for drag-drop override)
  positionX: { type: Number, default: null },
  positionY: { type: Number, default: null },
  // Size in grid units
  width:   { type: Number, default: 1, min: 1 },
  height:  { type: Number, default: 1, min: 1 },
  // Rotation in degrees (0, 90, 180, 270)
  rotation: { type: Number, default: 0 },
  price:   { type: Number, default: 0, min: 0 },
  notes:   { type: String, default: '', maxlength: 1000 },
}, { timestamps: true })

BoothSchema.index({ hallId: 1 })
BoothSchema.index({ expoId: 1 })
BoothSchema.index({ exhibitorId: 1 })
BoothSchema.index({ status: 1 })
BoothSchema.index({ expoId: 1, status: 1 })

module.exports = mongoose.model('Booth', BoothSchema)
