const jwt = require('jsonwebtoken')
const User = require('../models/User.model')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../utils/asyncHandler')

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token
  if (!token) throw new ApiError(401, 'Not authenticated')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive')
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Not authenticated')
    }
    throw error
  }
})

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    throw new ApiError(403, `Role '${req.user.role}' is not authorized`)
  next()
}

module.exports = { protect, authorize }
