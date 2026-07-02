const SessionBooking = require('../models/SessionBooking.model')
const Session = require('../models/Session.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')

// POST /api/bookings
const bookSession = asyncHandler(async (req, res) => {
  const { sessionId, expoId } = req.body
  const session = await Session.findById(sessionId)
  if (!session || session.status === 'Cancelled') throw new ApiError(404, 'Session not found or cancelled')

  if (session.capacity > 0 && session.bookedCount >= session.capacity) {
    throw new ApiError(400, 'Session is at full capacity')
  }

  const existing = await SessionBooking.findOne({ sessionId, attendeeId: req.user._id })
  if (existing) throw new ApiError(409, 'You already booked this session')

  const booking = await SessionBooking.create({ sessionId, attendeeId: req.user._id, expoId })
  await Session.findByIdAndUpdate(sessionId, { $inc: { bookedCount: 1 } })

  created(res, { booking }, 'Session booked')
})

// GET /api/bookings/my
const listMyBookings = asyncHandler(async (req, res) => {
  const bookings = await SessionBooking.find({ attendeeId: req.user._id })
    .populate({
      path: 'sessionId',
      select: 'title startTime endTime status speakerName',
      populate: { path: 'stageId', select: 'name' },
    })
    .populate('expoId', 'name bannerImage startDate endDate location')
    .sort({ bookedAt: -1 })
  ok(res, { bookings })
})

// DELETE /api/bookings/:sessionId
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await SessionBooking.findOneAndDelete({ sessionId: req.params.sessionId, attendeeId: req.user._id })
  if (!booking) throw new ApiError(404, 'Booking not found')
  await Session.findByIdAndUpdate(req.params.sessionId, { $inc: { bookedCount: -1 } })
  ok(res, null, 'Booking cancelled')
})

module.exports = { bookSession, listMyBookings, cancelBooking }
