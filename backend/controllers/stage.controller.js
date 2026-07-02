const Stage = require('../models/Stage.model')
const Expo = require('../models/Expo.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')

const createStage = asyncHandler(async (req, res) => {
  const { expoId, name, capacity, description, location } = req.body
  const expo = await Expo.findOne({ _id: expoId, isDeleted: false })
  if (!expo) throw new ApiError(404, 'Expo not found')
  if (expo.organizerId.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized')

  const stage = await Stage.create({ name, expoId, capacity, description, location })
  created(res, { stage }, 'Stage created')
})

const listByExpo = asyncHandler(async (req, res) => {
  const stages = await Stage.find({ expoId: req.params.expoId }).sort({ name: 1 })
  ok(res, { stages })
})

const updateStage = asyncHandler(async (req, res) => {
  const stage = await Stage.findById(req.params.id)
  if (!stage) throw new ApiError(404, 'Stage not found')
  const { name, capacity, description, location } = req.body
  if (name) stage.name = name
  if (capacity !== undefined) stage.capacity = capacity
  if (description !== undefined) stage.description = description
  if (location !== undefined) stage.location = location
  await stage.save()
  ok(res, { stage }, 'Stage updated')
})

const deleteStage = asyncHandler(async (req, res) => {
  const stage = await Stage.findByIdAndDelete(req.params.id)
  if (!stage) throw new ApiError(404, 'Stage not found')
  ok(res, null, 'Stage deleted')
})

module.exports = { createStage, listByExpo, updateStage, deleteStage }
