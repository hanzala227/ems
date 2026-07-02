const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const { registerForExpo, listMyRegistrations, cancelRegistration, listByExpo } = require('../controllers/registration.controller')

router.post('/', protect, authorize('attendee'), registerForExpo)
router.get('/my', protect, authorize('attendee'), listMyRegistrations)
router.delete('/:expoId', protect, authorize('attendee'), cancelRegistration)
router.get('/expo/:expoId', protect, authorize('organizer'), listByExpo)

module.exports = router
