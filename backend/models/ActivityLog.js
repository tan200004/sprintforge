const mongoose = require('mongoose');

const activityActionTypes = [
  'created_task',
  'updated_task',
  'deleted_task',
  'moved_task',
  'assigned_task',
  'commented_on_task',
  'uploaded_file',
  'created_project',
  'updated_project',
  'deleted_project',
  'added_member',
  'removed_member',
  'changed_priority',
  'changed_status',
  'completed_task',
];

const sprintforgeActivitySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      enum: activityActionTypes,
      required: true,
    },
    entityKind: {
      type: String,
      enum: ['Task', 'Project', 'Comment', 'User'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityTitle: String,
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    changeDetails: {
      fieldChanged: String,
      previousValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
    },
    humanReadableSummary: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

sprintforgeActivitySchema.index({ relatedProject: 1, createdAt: -1 });
sprintforgeActivitySchema.index({ actor: 1, createdAt: -1 });

const SprintforgeActivity = mongoose.model('ActivityLog', sprintforgeActivitySchema);
module.exports = SprintforgeActivity;
