const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    url: { type: String },
    publicId: { type: String },
    name: { type: String },
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['organizer', 'exhibitor', 'attendee'],
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    company: {
      type: String,
      default: null,
    },
    companyLogo: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    resetPasswordToken: {
      type: String,
      select: false,
      default: undefined,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
