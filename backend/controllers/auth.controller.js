const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const User = require('../models/User.model')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok, created } = require('../utils/ApiResponse')
const { signToken, setTokenCookie, clearTokenCookie } = require('../services/auth.service')

// Helper — return public user fields (no password, no reset token)
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  company: user.company,
  companyLogo: user.companyLogo,
  bio: user.bio,
  phone: user.phone,
  website: user.website,
  industry: user.industry,
  isActive: user.isActive,
  createdAt: user.createdAt,
})

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body
  const existing = await User.findOne({ email })
  if (existing) throw new ApiError(409, 'Email already in use')
  const hashed = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, password: hashed, role })
  const token = signToken(user._id, user.role)
  setTokenCookie(res, token)
  created(res, { user: publicUser(user) }, 'Registration successful')
})

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await bcrypt.compare(password, user.password)))
    throw new ApiError(401, 'Invalid email or password')
  if (!user.isActive) throw new ApiError(401, 'Account is deactivated')
  const token = signToken(user._id, user.role)
  setTokenCookie(res, token)
  ok(res, { user: publicUser(user) }, 'Login successful')
})

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res)
  ok(res, null, 'Logged out successfully')
})

// POST /api/auth/forgot-password
// No email sending — returns plain token in response for development use
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  // Always return 200 to prevent user enumeration
  const user = await User.findOne({ email })
  if (!user) return ok(res, null, 'If that email exists, a reset token has been generated')
  // Generate plain token and store its hash
  const plainToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex')
  user.resetPasswordToken = hashedToken
  user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  await user.save({ validateBeforeSave: false })
  ok(res, { resetToken: plainToken }, 'Reset token generated (dev mode — no email sent)')
})

// POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { password } = req.body
  if (!password || password.length < 8)
    throw new ApiError(400, 'Password must be at least 8 characters')
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpiry')
  if (!user) throw new ApiError(400, 'Invalid or expired reset token')
  user.password = await bcrypt.hash(password, 12)
  user.resetPasswordToken = undefined
  user.resetPasswordExpiry = undefined
  await user.save({ validateBeforeSave: false })
  ok(res, null, 'Password reset successful')
})

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  ok(res, { user: publicUser(req.user) }, 'User profile retrieved')
})

module.exports = { register, login, logout, forgotPassword, resetPassword, getMe }
