const Application = require('../models/Application.model')
const Expo = require('../models/Expo.model')
const Booth = require('../models/Booth.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')
const { createAndEmit } = require('../services/notification.service')

// POST /api/applications — exhibitor submits application
const submitApplication = asyncHandler(async (req, res) => {
  const { expoId, companyDescription, category, boothPreference, specialRequirements } = req.body

  const expo = await Expo.findOne({ _id: expoId, isDeleted: false, status: { $in: ['Published', 'Live'] } })
  if (!expo) throw new ApiError(404, 'Expo not found or not accepting applications')

  const existing = await Application.findOne({ expoId, exhibitorId: req.user._id })
  if (existing) throw new ApiError(409, `You already applied to this expo (status: ${existing.status})`)

  const application = await Application.create({
    expoId, exhibitorId: req.user._id,
    companyDescription, category, boothPreference, specialRequirements,
  })

  // Notify organizer
  const io = req.app.locals.io
  await createAndEmit(
    expo.organizerId,
    'new_application',
    'New Exhibitor Application',
    `${req.user.name} applied to "${expo.name}"`,
    `/organizer/expos/${expoId}/applications`,
    io,
  )

  created(res, { application }, 'Application submitted')
})

// GET /api/applications/expo/:expoId — organizer views applications
const listByExpo = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query
  const expo = await Expo.findOne({ _id: req.params.expoId, isDeleted: false })
  if (!expo) throw new ApiError(404, 'Expo not found')
  if (expo.organizerId.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized')

  const filter = { expoId: req.params.expoId }
  if (status && status !== 'all') filter.status = status

  const skip = (Number(page) - 1) * Number(limit)
  let query = Application.find(filter)
    .populate('exhibitorId', 'name email avatar company companyLogo industry')
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(Number(limit))

  const [applications, total] = await Promise.all([query, Application.countDocuments(filter)])

  // Filter by search after populate
  let results = applications
  if (search) {
    const q = search.toLowerCase()
    results = applications.filter(a =>
      a.exhibitorId?.name?.toLowerCase().includes(q) ||
      a.exhibitorId?.company?.toLowerCase().includes(q)
    )
  }

  ok(res, { applications: results, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
})

// GET /api/applications/my — exhibitor's own applications
const listMine = asyncHandler(async (req, res) => {
  const applications = await Application.find({ exhibitorId: req.user._id })
    .populate('expoId', 'name bannerImage startDate endDate location status')
    .sort({ appliedAt: -1 })
  ok(res, { applications })
})

// GET /api/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('exhibitorId', 'name email avatar company companyLogo industry')
    .populate('expoId', 'name startDate endDate location')
  if (!application) throw new ApiError(404, 'Application not found')
  ok(res, { application })
})

// PATCH /api/applications/:id/approve
const approveApplication = asyncHandler(async (req, res) => {
  const { organizerNote } = req.body
  const application = await Application.findById(req.params.id).populate('expoId')
  if (!application) throw new ApiError(404, 'Application not found')
  if (application.expoId.organizerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized')
  }

  application.status = 'approved'
  if (organizerNote) application.organizerNote = organizerNote
  await application.save()

  // If booth preference specified, reserve that booth
  if (application.boothPreference) {
    await Booth.findOneAndUpdate(
      { boothNumber: application.boothPreference, expoId: application.expoId._id, status: 'available' },
      { status: 'reserved', exhibitorId: application.exhibitorId, applicationId: application._id }
    )
  }

  // Notify exhibitor
  const io = req.app.locals.io
  await createAndEmit(
    application.exhibitorId,
    'application_approved',
    'Application Approved!',
    `Your application to "${application.expoId.name}" has been approved.`,
    `/exhibitor/applications`,
    io,
  )

  ok(res, { application }, 'Application approved')
})

// PATCH /api/applications/:id/reject
const rejectApplication = asyncHandler(async (req, res) => {
  const { organizerNote } = req.body
  const application = await Application.findById(req.params.id).populate('expoId')
  if (!application) throw new ApiError(404, 'Application not found')
  if (application.expoId.organizerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized')
  }

  application.status = 'rejected'
  application.organizerNote = organizerNote || ''
  await application.save()

  const io = req.app.locals.io
  await createAndEmit(
    application.exhibitorId,
    'application_rejected',
    'Application Update',
    `Your application to "${application.expoId.name}" was not approved.`,
    `/exhibitor/applications`,
    io,
  )

  ok(res, { application }, 'Application rejected')
})

// GET /api/applications/organizer/exhibitors — gets unique approved exhibitors across all expos for the logged-in organizer
const listOrganizerExhibitors = asyncHandler(async (req, res) => {
  const expos = await Expo.find({ organizerId: req.user._id, isDeleted: false }).distinct('_id')
  
  const applications = await Application.find({ expoId: { $in: expos }, status: 'approved' })
    .populate('exhibitorId', 'name email avatar company industry phone website createdAt')
    .sort({ appliedAt: -1 })
    
  // Deduplicate exhibitors
  const uniqueUsers = []
  const seen = new Set()
  
  applications.forEach(app => {
    if (app.exhibitorId && !seen.has(app.exhibitorId._id.toString())) {
      seen.add(app.exhibitorId._id.toString())
      uniqueUsers.push(app.exhibitorId)
    }
  })
  
  ok(res, { users: uniqueUsers })
})

module.exports = { submitApplication, listByExpo, listMine, getApplication, approveApplication, rejectApplication, listOrganizerExhibitors }
