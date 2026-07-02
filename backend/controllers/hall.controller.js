const Hall = require('../models/Hall.model')
const Booth = require('../models/Booth.model')
const Expo = require('../models/Expo.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')
const { generateBooths } = require('../services/floorplan.service')

// POST /api/halls
const createHall = asyncHandler(async (req, res) => {
  const { expoId, name, rows, columns, floorNumber, description } = req.body

  const expo = await Expo.findOne({ _id: expoId, isDeleted: false })
  if (!expo) throw new ApiError(404, 'Expo not found')
  if (expo.organizerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized')
  }

  const hall = await Hall.create({
    name, expoId, organizerId: req.user._id,
    rows: Number(rows), columns: Number(columns),
    floorNumber: floorNumber || 1, description,
  })

  // Auto-generate booths
  await generateBooths(hall._id, expoId, Number(rows), Number(columns), name)

  ok(res, { hall }, 'Hall created with booths', 201)
})

// GET /api/halls/expo/:expoId
const listHallsByExpo = asyncHandler(async (req, res) => {
  const halls = await Hall.find({ expoId: req.params.expoId }).sort({ floorNumber: 1, createdAt: 1 })
  ok(res, { halls })
})

// GET /api/halls/:id
const getHall = asyncHandler(async (req, res) => {
  const hall = await Hall.findById(req.params.id)
  if (!hall) throw new ApiError(404, 'Hall not found')
  ok(res, { hall })
})

// PATCH /api/halls/:id
const updateHall = asyncHandler(async (req, res) => {
  const hall = await Hall.findById(req.params.id)
  if (!hall) throw new ApiError(404, 'Hall not found')
  if (hall.organizerId.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized')

  const { name, floorNumber, description } = req.body
  if (name) hall.name = name
  if (floorNumber !== undefined) hall.floorNumber = floorNumber
  if (description !== undefined) hall.description = description
  await hall.save()

  ok(res, { hall }, 'Hall updated')
})

// DELETE /api/halls/:id — cascades booths
const deleteHall = asyncHandler(async (req, res) => {
  const hall = await Hall.findById(req.params.id)
  if (!hall) throw new ApiError(404, 'Hall not found')
  if (hall.organizerId.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized')

  await Booth.deleteMany({ hallId: hall._id })
  await Hall.findByIdAndDelete(hall._id)

  ok(res, null, 'Hall and booths deleted')
})

module.exports = { createHall, listHallsByExpo, getHall, updateHall, deleteHall }
