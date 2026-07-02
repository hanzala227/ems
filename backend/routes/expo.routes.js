const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth.middleware')
const { imageUpload } = require('../middleware/upload.middleware')
const {
  createExpo, listPublicExpos, listMyExpos,
  getExpo, updateExpo, deleteExpo, changeExpoStatus,
} = require('../controllers/expo.controller')

router.get('/', listPublicExpos)
router.get('/my', protect, authorize('organizer'), listMyExpos)
router.get('/:id', getExpo)
router.post('/', protect, authorize('organizer'), imageUpload.single('banner'), createExpo)
router.patch('/:id', protect, authorize('organizer'), imageUpload.single('banner'), updateExpo)
router.delete('/:id', protect, authorize('organizer'), deleteExpo)
router.patch('/:id/status', protect, authorize('organizer'), changeExpoStatus)

module.exports = router
