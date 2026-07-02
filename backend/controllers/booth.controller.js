const Booth = require('../models/Booth.model')
const Hall = require('../models/Hall.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok } = require('../utils/ApiResponse')
const { createAndEmit } = require('../services/notification.service')

// GET /api/booths/hall/:hallId
const listByHall = asyncHandler(async (req, res) => {
  const booths = await Booth.find({ hallId: req.params.hallId })
    .sort({ row: 1, col: 1 })
    .populate('exhibitorId', 'name company companyLogo avatar')
  ok(res, { booths })
})

// GET /api/booths/:id
const getBooth = asyncHandler(async (req, res) => {
  const booth = await Booth.findById(req.params.id)
    .populate('exhibitorId', 'name company companyLogo avatar')
    .populate('hallId', 'name floorNumber')
  if (!booth) throw new ApiError(404, 'Booth not found')
  ok(res, { booth })
})

// PATCH /api/booths/:id/assign — organizer assigns booth to exhibitor
const assignBooth = asyncHandler(async (req, res) => {
  const { exhibitorId, applicationId } = req.body
  const booth = await Booth.findById(req.params.id)
  if (!booth) throw new ApiError(404, 'Booth not found')

  booth.exhibitorId = exhibitorId || null
  booth.applicationId = applicationId || null
  booth.status = exhibitorId ? 'occupied' : 'available'
  await booth.save()


  // Notify exhibitor
  if (exhibitorId) {
    const io = req.app.locals.io
    await createAndEmit(
      exhibitorId,
      'booth_assigned',
      'Booth Assigned',
      `You have been assigned booth ${booth.boothNumber}.`,
      `/exhibitor/my-booth`,
      io,
    )
  }

  ok(res, { booth }, 'Booth assigned')
})

// PATCH /api/booths/:id/status — organizer changes status
const changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const validStatuses = ['available', 'reserved', 'occupied', 'pending', 'blocked']
  if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid booth status')

  const booth = await Booth.findById(req.params.id)
  if (!booth) throw new ApiError(404, 'Booth not found')

  if (status === 'available') {
    booth.exhibitorId = null
    booth.applicationId = null
  }
  booth.status = status
  await booth.save()


  ok(res, { booth }, 'Booth status updated')
})

// PATCH /api/booths/:id/position — drag-drop update
const updatePosition = asyncHandler(async (req, res) => {
  const { positionX, positionY } = req.body
  const booth = await Booth.findById(req.params.id)
  if (!booth) throw new ApiError(404, 'Booth not found')

  booth.positionX = positionX
  booth.positionY = positionY
  await booth.save()


  ok(res, { booth }, 'Booth position updated')
})

// PATCH /api/booths/:id/resize
const resizeBooth = asyncHandler(async (req, res) => {
  const { width, height } = req.body
  const booth = await Booth.findById(req.params.id)
  if (!booth) throw new ApiError(404, 'Booth not found')

  if (width) booth.width = width
  if (height) booth.height = height
  await booth.save()


  ok(res, { booth }, 'Booth resized')
})

// POST /api/booths/:id/select — exhibitor selects booth (sets pending)
const selectBooth = asyncHandler(async (req, res) => {
  const booth = await Booth.findById(req.params.id)
  if (!booth) throw new ApiError(404, 'Booth not found')
  if (booth.status !== 'available') throw new ApiError(400, 'Booth is not available for selection')

  booth.exhibitorId = req.user._id
  booth.status = 'pending'
  await booth.save()


  // Notify organizer (find hall owner)
  const hall = await Hall.findById(booth.hallId)
  if (hall) {
    const io = req.app.locals.io
    await createAndEmit(
      hall.organizerId,
      'booth_selected',
      'Booth Selection Request',
      `${req.user.name} selected booth ${booth.boothNumber} — pending your approval.`,
      `/organizer/expos/${booth.expoId}/floor-plan`,
      io,
    )
  }

  ok(res, { booth }, 'Booth selected — pending organizer approval')
})

// GET /api/booths/my — get booths assigned or pending for the exhibitor
const listMyBooths = asyncHandler(async (req, res) => {
  const booths = await Booth.find({ exhibitorId: req.user._id })
    .populate('hallId', 'name floorNumber')
    .populate({
      path: 'expoId',
      select: 'name bannerImage startDate endDate location status'
    })
  ok(res, { booths })
})

module.exports = { listByHall, getBooth, assignBooth, changeStatus, updatePosition, resizeBooth, selectBooth, listMyBooths }
