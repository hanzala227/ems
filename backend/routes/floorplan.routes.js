const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const { getFloorPlanByHall, saveFloorPlan } = require('../controllers/floorplan.controller')

router.get('/hall/:hallId', getFloorPlanByHall)
router.put('/hall/:hallId', protect, authorize('organizer'), saveFloorPlan)

module.exports = router
