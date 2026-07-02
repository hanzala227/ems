const mongoose = require('mongoose')

const FloorPlanSchema = new mongoose.Schema({
  expoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true, unique: true },
  zoom: { type: Number, default: 1 },
  panX: { type: Number, default: 0 },
  panY: { type: Number, default: 0 },
  showGrid: { type: Boolean, default: true },
  elements: { type: Array, default: [] } // For custom layout blocks or shapes
}, { timestamps: true })

FloorPlanSchema.index({ expoId: 1 })

module.exports = mongoose.model('FloorPlan', FloorPlanSchema)
