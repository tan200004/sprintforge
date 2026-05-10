const mongoose = require('mongoose');

const notificationEventTypes = [
  'task_assigned',
  'task_status_changed',
  'task_commented',
  'task_due_soon',
  'task_overdue',
  'project_member_added',
  'project_deadline_approaching',
  'mention',
  'file_uploaded',
  'sprint_started',
  'sprint_completed',
];

const sprintforgeNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    eventType: {
      type: String,
      enum: notificationEventTypes,
      required: true,
    },
    headline: {
      type: String,
      required: true,
      maxlength: 250,
    },
    bodyText: {
      type: String,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    linkedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    deepLinkUrl: String,
  },
  {
    timestamps: true,
  }
);

sprintforgeNotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const SprintforgeNotification = mongoose.model('Notification', sprintforgeNotificationSchema);
module.exports = SprintforgeNotification;
