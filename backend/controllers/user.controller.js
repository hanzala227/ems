const User = require('../models/User.model')
const bcrypt = require('bcryptjs')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { ok } = require('../utils/ApiResponse')
const { uploadToCloudinary } = require('../services/cloudinary.service')

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  ok(res, { user: req.user })
})

// PATCH /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, phone, website, industry, company } = req.body
  const user = await User.findById(req.user._id)
  if (name) user.name = name
  if (bio !== undefined) user.bio = bio
  if (phone !== undefined) user.phone = phone
  if (website !== undefined) user.website = website
  if (industry !== undefined) user.industry = industry
  if (company !== undefined) user.company = company
  await user.save()
  ok(res, { user }, 'Profile updated')
})

// PATCH /api/users/avatar
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided')
  const result = await uploadToCloudinary(req.file.buffer, 'eventsphere/avatars', 'image')
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url },
    { new: true },
  )
  ok(res, { user }, 'Avatar updated')
})

// PATCH /api/users/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'Current and new password (min 8 chars) required')
  }
  const user = await User.findById(req.user._id).select('+password')
  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect')
  user.password = await bcrypt.hash(newPassword, 12)
  await user.save()
  ok(res, null, 'Password changed successfully')
})

// POST /api/users/documents
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file provided')
  const result = await uploadToCloudinary(req.file.buffer, 'eventsphere/documents', 'auto')
  const user = await User.findById(req.user._id)
  user.documents.push({
    url: result.secure_url,
    publicId: result.public_id,
    name: req.file.originalname,
    type: req.file.mimetype,
    uploadedAt: new Date(),
  })
  await user.save()
  ok(res, { documents: user.documents }, 'Document uploaded')
})

// DELETE /api/users/documents/:docId
const deleteDocument = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  user.documents = user.documents.filter(d => d._id.toString() !== req.params.docId)
  await user.save()
  ok(res, { documents: user.documents }, 'Document removed')
})

// GET /api/users/search?q=term  (for starting conversations)
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return ok(res, { users: [] })
  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user._id },
    isActive: true,
  }).select('name email avatar role company').limit(10)
  ok(res, { users })
})

module.exports = { getProfile, updateProfile, updateAvatar, changePassword, uploadDocument, deleteDocument, searchUsers }
