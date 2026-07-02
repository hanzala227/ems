const Session = require('../models/Session.model')
const Stage = require('../models/Stage.model')
const Expo = require('../models/Expo.model')
const SessionBooking = require('../models/SessionBooking.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')
const { createAndEmit } = require('../services/notification.service')

// POST /api/sessions
const createSession = asyncHandler(async (req, res) => {
  const { expoId, stageId, title, description, speakerName, speakerBio, startTime, endTime, capacity } = req.body

  const expo = await Expo.findOne({ _id: expoId, isDeleted: false })
  if (!expo) throw new ApiError(404, 'Expo not found')
  if (expo.organizerId.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized')

  if (new Date(endTime) <= new Date(startTime)) throw new ApiError(400, 'End time must be after start time')

  // Check for conflicting sessions on the same stage
  const conflict = await Session.findOne({
    stageId,
    status: { $nin: ['Cancelled'] },
    $or: [
      { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
    ],
  })
  if (conflict) throw new ApiError(409, `Session conflicts with "${conflict.title}" on this stage`)

  const session = await Session.create({
    expoId, stageId, title, description,
    speakerName, speakerBio, startTime, endTime,
    capacity: capacity || 0,
  })

  created(res, { session }, 'Session created')
})

// GET /api/sessions/expo/:expoId
const listByExpo = asyncHandler(async (req, res) => {
  const { date } = req.query
  const filter = { expoId: req.params.expoId }
  if (date) {
    const d = new Date(date)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    filter.startTime = { $gte: d, $lt: next }
  }
  const sessions = await Session.find(filter)
    .populate('stageId', 'name location')
    .sort({ startTime: 1 })
  ok(res, { sessions })
})

// PATCH /api/sessions/:id
const updateSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
  if (!session) throw new ApiError(404, 'Session not found')
  const { title, description, speakerName, speakerBio, startTime, endTime, capacity } = req.body
  if (title) session.title = title
  if (description !== undefined) session.description = description
  if (speakerName !== undefined) session.speakerName = speakerName
  if (speakerBio !== undefined) session.speakerBio = speakerBio
  if (startTime) session.startTime = startTime
  if (endTime) session.endTime = endTime
  if (capacity !== undefined) session.capacity = capacity
  await session.save()
  ok(res, { session }, 'Session updated')
})

// PATCH /api/sessions/:id/status
const changeSessionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const session = await Session.findById(req.params.id).populate('expoId', 'organizerId')
  if (!session) throw new ApiError(404, 'Session not found')

  session.status = status
  await session.save()

  // If going Live, notify all registered attendees for this expo
  if (status === 'Live') {
    const ExpoRegistration = require('../models/ExpoRegistration.model')
    const io = req.app.locals.io
    const registrations = await ExpoRegistration.find({ expoId: session.expoId._id, status: 'registered' })
    for (const reg of registrations) {
      await createAndEmit(
        reg.attendeeId, 'session_live', '🎙️ Session is Live!',
        `"${session.title}" has just started.`, `/attendee/events/${session.expoId._id}/schedule`, io
      )
    }
  }

  ok(res, { session }, `Session status changed to ${status}`)
})

// DELETE /api/sessions/:id — cancels bookings + notifies attendees
const deleteSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).populate('expoId', 'organizerId name')
  if (!session) throw new ApiError(404, 'Session not found')
  if (session.expoId.organizerId.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized')

  const bookings = await SessionBooking.find({ sessionId: session._id })
  const io = req.app.locals.io
  for (const b of bookings) {
    await createAndEmit(
      b.attendeeId, 'session_cancelled', 'Session Cancelled',
      `"${session.title}" has been cancelled.`, null, io
    )
  }

  await SessionBooking.deleteMany({ sessionId: session._id })
  await Session.findByIdAndDelete(session._id)

  ok(res, null, 'Session deleted and attendees notified')
})

module.exports = { createSession, listByExpo, updateSession, changeSessionStatus, deleteSession }
