const ExpoRegistration = require('../models/ExpoRegistration.model')
const Expo = require('../models/Expo.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')

// POST /api/registrations
const registerForExpo = asyncHandler(async (req, res) => {
  const { expoId } = req.body
  const expo = await Expo.findOne({ _id: expoId, isDeleted: false, status: { $in: ['Published', 'Live'] } })
  if (!expo) throw new ApiError(404, 'Expo not found or not available for registration')

  const existing = await ExpoRegistration.findOne({ expoId, attendeeId: req.user._id })
  if (existing) throw new ApiError(409, 'You are already registered for this expo')

  if (expo.capacity > 0 && expo.registeredCount >= expo.capacity) {
    throw new ApiError(400, 'This expo has reached its capacity')
  }

  const registration = await ExpoRegistration.create({ expoId, attendeeId: req.user._id })
  await Expo.findByIdAndUpdate(expoId, { $inc: { registeredCount: 1 } })

  created(res, { registration }, 'Registered successfully')
})

// GET /api/registrations/my
const listMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await ExpoRegistration.find({ attendeeId: req.user._id, status: 'registered' })
    .populate('expoId', 'name bannerImage startDate endDate location status category registeredCount capacity')
    .sort({ registeredAt: -1 })
  ok(res, { registrations })
})

// DELETE /api/registrations/:expoId
const cancelRegistration = asyncHandler(async (req, res) => {
  const reg = await ExpoRegistration.findOneAndDelete({ expoId: req.params.expoId, attendeeId: req.user._id })
  if (!reg) throw new ApiError(404, 'Registration not found')
  await Expo.findByIdAndUpdate(req.params.expoId, { $inc: { registeredCount: -1 } })
  ok(res, null, 'Registration cancelled')
})

// GET /api/registrations/expo/:expoId — organizer view
const listByExpo = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const [registrations, total] = await Promise.all([
    ExpoRegistration.find({ expoId: req.params.expoId, status: 'registered' })
      .populate('attendeeId', 'name email avatar')
      .sort({ registeredAt: -1 }).skip(skip).limit(Number(limit)),
    ExpoRegistration.countDocuments({ expoId: req.params.expoId, status: 'registered' }),
  ])
  ok(res, { registrations, total })
})

module.exports = { registerForExpo, listMyRegistrations, cancelRegistration, listByExpo }
