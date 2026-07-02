const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const { createHall, listHallsByExpo, getHall, updateHall, deleteHall } = require('../controllers/hall.controller')

router.get('/expo/:expoId', listHallsByExpo)
router.get('/:id', getHall)
router.post('/', protect, authorize('organizer'), createHall)
router.patch('/:id', protect, authorize('organizer'), updateHall)
router.delete('/:id', protect, authorize('organizer'), deleteHall)

module.exports = router
