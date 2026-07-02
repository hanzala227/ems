const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const { createStage, listByExpo, updateStage, deleteStage } = require('../controllers/stage.controller')

router.get('/expo/:expoId', listByExpo)
router.post('/', protect, authorize('organizer'), createStage)
router.patch('/:id', protect, authorize('organizer'), updateStage)
router.delete('/:id', protect, authorize('organizer'), deleteStage)

module.exports = router
