const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const {
  submitApplication, listByExpo, listMine,
  getApplication, approveApplication, rejectApplication, listOrganizerExhibitors
} = require('../controllers/application.controller')

router.post('/', protect, authorize('exhibitor'), submitApplication)
router.get('/my', protect, authorize('exhibitor'), listMine)
router.get('/organizer/exhibitors', protect, authorize('organizer'), listOrganizerExhibitors)
router.get('/expo/:expoId', protect, authorize('organizer'), listByExpo)
router.get('/:id', protect, getApplication)
router.patch('/:id/approve', protect, authorize('organizer'), approveApplication)
router.patch('/:id/reject',  protect, authorize('organizer'), rejectApplication)

module.exports = router
