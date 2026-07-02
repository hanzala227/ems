const jwt = require('jsonwebtoken')

/**
 * Sign a JWT containing userId and role.
 */
const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })

/**
 * Set the JWT as an httpOnly cookie on the response.
 */
const setTokenCookie = (res, token) => {
  const expiryDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiryDays * 24 * 60 * 60 * 1000,
  })
}

/**
 * Clear the JWT cookie (logout).
 */
const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  })
}

module.exports = { signToken, setTokenCookie, clearTokenCookie }
