const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const {
  createSession, listByExpo, updateSession,
  changeSessionStatus, deleteSession,
} = require('../controllers/session.controller')

router.get('/expo/:expoId', listByExpo)
router.post('/', protect, authorize('organizer'), createSession)
router.patch('/:id', protect, authorize('organizer'), updateSession)
router.patch('/:id/status', protect, authorize('organizer'), changeSessionStatus)
router.delete('/:id', protect, authorize('organizer'), deleteSession)

module.exports = router
