const mongoose = require('mongoose');

const mentionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  displayName: String,
});

const sprintforgeCommentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      maxlength: [3000, 'Comment cannot exceed 3000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    mentions: [mentionSchema],
    attachments: [
      {
        originalName: String,
        filePath: String,
        mimeType: String,
        sizeInBytes: Number,
      },
    ],
    reactions: [
      {
        emoji: String,
        reactedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sprintforgeCommentSchema.index({ parentTask: 1, createdAt: 1 });
sprintforgeCommentSchema.index({ author: 1 });

const SprintforgeComment = mongoose.model('Comment', sprintforgeCommentSchema);
module.exports = SprintforgeComment;
