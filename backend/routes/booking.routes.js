const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const { bookSession, listMyBookings, cancelBooking } = require('../controllers/booking.controller')

router.post('/', protect, authorize('attendee'), bookSession)
router.get('/my', protect, authorize('attendee'), listMyBookings)
router.delete('/:sessionId', protect, authorize('attendee'), cancelBooking)

module.exports = router
