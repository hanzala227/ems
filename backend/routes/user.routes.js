const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const { imageUpload, documentUpload } = require('../middleware/upload.middleware')
const {
  getProfile, updateProfile, updateAvatar, changePassword,
  uploadDocument, deleteDocument, searchUsers,
} = require('../controllers/user.controller')

router.use(protect)

router.get('/profile',           getProfile)
router.patch('/profile',         updateProfile)
router.patch('/avatar',          imageUpload.single('avatar'), updateAvatar)
router.patch('/password',        changePassword)
router.post('/documents',        documentUpload.single('document'), uploadDocument)
router.delete('/documents/:docId', deleteDocument)
router.get('/search',            searchUsers)

module.exports = router
