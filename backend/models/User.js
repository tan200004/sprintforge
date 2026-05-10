const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TheUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please tell us your name'],
      trim: true,
      minlength: [2, 'Name has to be at least 2 chars'],
      maxlength: [80, 'Name is way too long'],
    },
    email: {
      type: String,
      required: [true, 'Need an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'That email looks fake'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Don\'t forget a password!'],
      minlength: 8,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    initials: {
      type: String,
      maxlength: 3,
    },
    role: {
      type: String,
      enum: ['admin', 'project_manager', 'member'],
      default: 'member',
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'pending_verification'],
      default: 'pending_verification',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      notificationsEnabled: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
    },
    bio: {
      type: String,
      maxlength: 300,
    },
    jobTitle: {
      type: String,
      maxlength: 100,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TheUserSchema.pre('save', function (nextFn) {
  if (this.isModified('fullName') || this.isNew) {
    const nameChunks = this.fullName.trim().split(' ');
    this.initials = nameChunks
      .slice(0, 2)
      .map((piece) => piece[0].toUpperCase())
      .join('');
  }
  nextFn();
});

TheUserSchema.pre('save', async function (nextFn) {
  if (!this.isModified('passwordHash')) return nextFn();
  const saltValue = 12;
  this.passwordHash = await bcrypt.hash(this.passwordHash, saltValue);
  nextFn();
});

TheUserSchema.methods.comparePassword = async function (typedPassword) {
  return bcrypt.compare(typedPassword, this.passwordHash);
};

TheUserSchema.virtual('publicProfile').get(function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    avatarUrl: this.avatarUrl,
    initials: this.initials,
    role: this.role,
    isOnline: this.isOnline,
    jobTitle: this.jobTitle,
    bio: this.bio,
  };
});

TheUserSchema.index({ role: 1 });

const UserModel = mongoose.model('User', TheUserSchema);
module.exports = UserModel;
