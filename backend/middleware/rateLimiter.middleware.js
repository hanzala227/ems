const rateLimit = require('express-rate-limit')

/** Applied globally to all routes – 100 requests per 15 minutes */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

/** Applied to auth routes – 10 attempts per 15 minutes */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { globalLimiter, authLimiter }
