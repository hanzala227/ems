const cloudinary = require('../config/cloudinary')

/**
 * Upload a buffer to Cloudinary using upload_stream.
 * @param {Buffer} buffer - File buffer from Multer memory storage
 * @param {string} folder - Cloudinary folder path
 * @param {string} resourceType - 'image' | 'raw' | 'auto'
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err)
        resolve(result)
      },
    )
    stream.end(buffer)
  })

/**
 * Delete a file from Cloudinary by public_id.
 */
const deleteFromCloudinary = (publicId, resourceType = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType })

module.exports = { uploadToCloudinary, deleteFromCloudinary }
