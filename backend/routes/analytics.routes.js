const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const { getDashboard, getPerformance, getEngagement, getOccupancy } = require('../controllers/analytics.controller')

router.get('/dashboard',   protect, authorize('organizer'), getDashboard)
router.get('/performance', protect, authorize('organizer'), getPerformance)
router.get('/engagement',  protect, authorize('organizer'), getEngagement)
router.get('/occupancy',   protect, authorize('organizer'), getOccupancy)

module.exports = router
