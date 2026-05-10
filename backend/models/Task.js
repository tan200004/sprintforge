const mongoose = require('mongoose');

const myBoardColumns = ['backlog', 'todo', 'in_progress', 'review', 'completed'];
const howImportantList = ['low', 'medium', 'high', 'critical'];

const myFileSchema = new mongoose.Schema({
  originalName: String,
  storedName: String,
  filePath: String,
  mimeType: String,
  sizeInBytes: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
});

const TheTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'You forgot the title!'],
      trim: true,
      minlength: [3, 'Make the title at least 3 letters'],
      maxlength: [250, 'Whoa, title is too long'],
    },
    taskCode: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      maxlength: [5000, 'Description too long'],
    },
    columnStatus: {
      type: String,
      enum: myBoardColumns,
      default: 'backlog',
    },
    priorityLevel: {
      type: String,
      enum: howImportantList,
      default: 'medium',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dueDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    loggedHours: {
      type: Number,
      default: 0,
    },
    labels: [
      {
        name: String,
        colorHex: String,
      },
    ],
    attachments: [myFileSchema],
    columnPosition: {
      type: Number,
      default: 0,
    },
    storyPoints: {
      type: Number,
      min: 0,
      max: 100,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: String,
    completedAt: Date,
    sprintName: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TheTaskSchema.pre('save', async function (nextFn) {
  if (this.isNew && !this.taskCode) {
    const numTasks = await mongoose.model('Task').countDocuments({ project: this.project });
    this.taskCode = `SF-${String(numTasks + 1).padStart(4, '0')}`;
  }
  if (this.isModified('columnStatus') && this.columnStatus === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  nextFn();
});

TheTaskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.columnStatus === 'completed') return false;
  return new Date() > new Date(this.dueDate);
});

TheTaskSchema.index({ project: 1, columnStatus: 1 });
TheTaskSchema.index({ assignees: 1 });
TheTaskSchema.index({ reporter: 1 });
TheTaskSchema.index({ priorityLevel: 1 });
TheTaskSchema.index({ dueDate: 1 });

const TaskModel = mongoose.model('Task', TheTaskSchema);
module.exports = TaskModel;
