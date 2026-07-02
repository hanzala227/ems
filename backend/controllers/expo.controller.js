const Expo = require('../models/Expo.model')
const Hall = require('../models/Hall.model')
const Booth = require('../models/Booth.model')
const Application = require('../models/Application.model')
const Session = require('../models/Session.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service')

// POST /api/expos — create new expo
const createExpo = asyncHandler(async (req, res) => {
  const { name, description, theme, startDate, endDate, location, category, capacity } = req.body

  if (new Date(endDate) <= new Date(startDate)) {
    throw new ApiError(400, 'End date must be after start date')
  }

  let bannerImage = null
  let bannerPublicId = null
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'eventsphere/banners')
    bannerImage = result.secure_url
    bannerPublicId = result.public_id
  }

  const expo = await Expo.create({
    name,
    description,
    theme,
    startDate,
    endDate,
    location: location ? (typeof location === 'string' ? JSON.parse(location) : location) : {},
    category,
    capacity: capacity || 0,
    bannerImage,
    bannerPublicId,
    organizerId: req.user._id,
  })

  created(res, { expo }, 'Expo created successfully')
})

// GET /api/expos — public list of Published/Live expos
const listPublicExpos = asyncHandler(async (req, res) => {
  const { search, category, country, page = 1, limit = 12 } = req.query
  const filter = { isDeleted: false, status: { $in: ['Published', 'Live'] } }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'location.city': { $regex: search, $options: 'i' } },
      { 'location.country': { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ]
  }
  if (category) filter.category = { $regex: category, $options: 'i' }
  if (country) filter['location.country'] = { $regex: country, $options: 'i' }

  const skip = (Number(page) - 1) * Number(limit)
  const [expos, total] = await Promise.all([
    Expo.find(filter)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('organizerId', 'name avatar company'),
    Expo.countDocuments(filter),
  ])

  ok(res, { expos, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
})

// GET /api/expos/my — organizer's own expos
const listMyExpos = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 10 } = req.query
  const filter = { organizerId: req.user._id, isDeleted: false }

  if (search) filter.name = { $regex: search, $options: 'i' }
  if (status) filter.status = status

  const skip = (Number(page) - 1) * Number(limit)
  const [expos, total] = await Promise.all([
    Expo.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Expo.countDocuments(filter),
  ])

  ok(res, { expos, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
})

// GET /api/expos/:id
const getExpo = asyncHandler(async (req, res) => {
  const expo = await Expo.findOne({ _id: req.params.id, isDeleted: false })
    .populate('organizerId', 'name avatar company email')
    .lean()
  if (!expo) throw new ApiError(404, 'Expo not found')

  const ExpoRegistration = require('../models/ExpoRegistration.model')
  const registeredCount = await ExpoRegistration.countDocuments({ expoId: expo._id, status: 'registered' })
  expo.registeredCount = registeredCount

  ok(res, { expo })
})

// PATCH /api/expos/:id
const updateExpo = asyncHandler(async (req, res) => {
  const expo = await Expo.findOne({ _id: req.params.id, isDeleted: false })
  if (!expo) throw new ApiError(404, 'Expo not found')
  if (expo.organizerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to update this expo')
  }

  const { name, description, theme, startDate, endDate, location, category, capacity, status } = req.body

  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    throw new ApiError(400, 'End date must be after start date')
  }

  // Handle banner image upload
  if (req.file) {
    if (expo.bannerPublicId) await deleteFromCloudinary(expo.bannerPublicId)
    const result = await uploadToCloudinary(req.file.buffer, 'eventsphere/banners')
    expo.bannerImage = result.secure_url
    expo.bannerPublicId = result.public_id
  }

  if (name) expo.name = name
  if (description) expo.description = description
  if (theme !== undefined) expo.theme = theme
  if (startDate) expo.startDate = startDate
  if (endDate) expo.endDate = endDate
  if (location) expo.location = typeof location === 'string' ? JSON.parse(location) : location
  if (category !== undefined) expo.category = category
  if (capacity !== undefined) expo.capacity = capacity
  if (status) expo.status = status

  await expo.save()
  ok(res, { expo }, 'Expo updated successfully')
})

// DELETE /api/expos/:id — soft delete
const deleteExpo = asyncHandler(async (req, res) => {
  const expo = await Expo.findOne({ _id: req.params.id, isDeleted: false })
  if (!expo) throw new ApiError(404, 'Expo not found')
  if (expo.organizerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this expo')
  }
  if (expo.status === 'Live' && !req.body.forceDelete) {
    throw new ApiError(400, 'Cannot delete a live expo. Pass forceDelete: true to override.')
  }

  expo.isDeleted = true
  expo.deletedAt = new Date()
  await expo.save()

  // Cascade soft-delete halls, booths, applications, sessions
  await Promise.all([
    Booth.updateMany({ expoId: expo._id }, { status: 'blocked' }),
    Application.updateMany({ expoId: expo._id, status: 'pending' }, { status: 'rejected', organizerNote: 'Expo deleted' }),
    Session.updateMany({ expoId: expo._id, status: { $in: ['Scheduled', 'Live'] } }, { status: 'Cancelled' }),
  ])

  ok(res, null, 'Expo deleted successfully')
})

// PATCH /api/expos/:id/status
const changeExpoStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const validStatuses = ['Draft', 'Published', 'Live', 'Ended', 'Cancelled']
  if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid status')

  const expo = await Expo.findOne({ _id: req.params.id, isDeleted: false })
  if (!expo) throw new ApiError(404, 'Expo not found')
  if (expo.organizerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized')
  }

  // Validate at least one hall before publishing
  if (status === 'Published') {
    const hallCount = await Hall.countDocuments({ expoId: expo._id })
    if (hallCount === 0) throw new ApiError(400, 'Cannot publish: add at least one hall with booths first')
  }

  expo.status = status
  await expo.save()
  ok(res, { expo }, `Expo status changed to ${status}`)
})

module.exports = { createExpo, listPublicExpos, listMyExpos, getExpo, updateExpo, deleteExpo, changeExpoStatus }
