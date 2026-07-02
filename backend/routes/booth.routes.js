const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const {
  listByHall, getBooth, assignBooth,
  changeStatus, updatePosition, resizeBooth, selectBooth, listMyBooths
} = require('../controllers/booth.controller')

router.get('/my', protect, authorize('exhibitor'), listMyBooths)
router.get('/hall/:hallId', listByHall)
router.get('/:id', getBooth)
router.patch('/:id/assign',   protect, authorize('organizer'), assignBooth)
router.patch('/:id/status',   protect, authorize('organizer'), changeStatus)
router.patch('/:id/position', protect, authorize('organizer'), updatePosition)
router.patch('/:id/resize',   protect, authorize('organizer'), resizeBooth)
router.post('/:id/select',    protect, authorize('exhibitor'), selectBooth)

module.exports = router
