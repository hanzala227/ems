const express = require('express')
const router = express.Router()
const { register, login, logout, forgotPassword, resetPassword, getMe } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')
const validate = require('../middleware/validate.middleware')
const { registerValidator, loginValidator } = require('../validators/auth.validator')

router.post('/register', registerValidator, validate, register)
router.post('/login', loginValidator, validate, login)
router.post('/logout', protect, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.get('/me', protect, getMe)

module.exports = router
