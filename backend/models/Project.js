const mongoose = require('mongoose');

const myStatusOptions = ['planning', 'active', 'on_hold', 'completed', 'archived'];
const myColorsList = ['indigo', 'violet', 'emerald', 'amber', 'rose', 'sky', 'teal', 'orange'];

const TheProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please give the project a name'],
      trim: true,
      minlength: [2, 'Name needs to be 2 letters at least'],
      maxlength: [120, 'Name is way too long'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Keep description under 2000 letters'],
    },
    status: {
      type: String,
      enum: myStatusOptions,
      default: 'planning',
    },
    colorTag: {
      type: String,
      enum: myColorsList,
      default: 'indigo',
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['lead', 'contributor', 'viewer'], default: 'contributor' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    deadline: {
      type: Date,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    estimatedHours: {
      type: Number,
      min: 0,
    },
    taskSummary: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    repositoryUrl: {
      type: String,
    },
    websiteUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TheProjectSchema.pre('save', function (nextFn) {
  if (this.isModified('name') || this.isNew) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') +
      '-' +
      Date.now().toString(36);
  }
  nextFn();
});

TheProjectSchema.virtual('completionPercent').get(function () {
  if (!this.taskSummary.total) return 0;
  return Math.round((this.taskSummary.completed / this.taskSummary.total) * 100);
});

TheProjectSchema.index({ owner: 1 });
TheProjectSchema.index({ status: 1 });
TheProjectSchema.index({ 'members.user': 1 });
TheProjectSchema.index({ slug: 1 });

const ProjectModel = mongoose.model('Project', TheProjectSchema);
module.exports = ProjectModel;
