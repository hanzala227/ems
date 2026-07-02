const mongoose = require('mongoose')

const StageSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  expoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Expo', required: true },
  capacity:    { type: Number, default: 0, min: 0 },
  description: { type: String, default: '', maxlength: 500 },
  location:    { type: String, default: '' },
}, { timestamps: true })

StageSchema.index({ expoId: 1 })

module.exports = mongoose.model('Stage', StageSchema)
