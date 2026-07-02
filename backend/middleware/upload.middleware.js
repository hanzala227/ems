const multer = require('multer')
const ApiError = require('../utils/ApiError')

// Keep files in memory so they can be forwarded to Cloudinary (or any cloud store)
const storage = multer.memoryStorage()

/**
 * File filter that accepts image/* MIME types only.
 */
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new ApiError(415, 'Only image files are allowed'), false)
  }
}

/**
 * File filter that accepts image/* and application/pdf.
 */
const documentFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new ApiError(415, 'Only image or PDF files are allowed'), false)
  }
}

/** Single / multiple image uploads – max 5 MB per file */
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
})

/** Single / multiple document uploads (images + PDFs) – max 10 MB per file */
const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFilter,
})

module.exports = { imageUpload, documentUpload }
