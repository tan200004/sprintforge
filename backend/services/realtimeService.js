const SprintforgeActivity = require('../models/ActivityLog');
const SprintforgeNotification = require('../models/Notification');

/**
 * Records a user action in the activity timeline
 */
const recordActivity = async ({
  actor,
  actionType,
  entityKind,
  entityId,
  entityTitle,
  relatedProject,
  changeDetails,
  humanReadableSummary,
}) => {
  try {
    await SprintforgeActivity.create({
      actor,
      actionType,
      entityKind,
      entityId,
      entityTitle,
      relatedProject,
      changeDetails,
      humanReadableSummary,
    });
  } catch (err) {
    console.error('⚠️  Activity log failed (non-fatal):', err.message);
  }
};

/**
 * Creates a notification and emits it via Socket.IO if user is online
 */
const pushNotification = async (io, { recipient, triggeredBy, eventType, headline, bodyText, linkedProject, linkedTask, deepLinkUrl }) => {
  try {
    const notification = await SprintforgeNotification.create({
      recipient,
      triggeredBy,
      eventType,
      headline,
      bodyText,
      linkedProject,
      linkedTask,
      deepLinkUrl,
    });

    // Emit to recipient's personal socket room
    if (io) {
      io.to(`user:${recipient.toString()}`).emit('forge:notification', {
        notification,
      });
    }

    return notification;
  } catch (err) {
    console.error('⚠️  Notification push failed (non-fatal):', err.message);
  }
};

/**
 * Broadcast a real-time task update to a project room
 */
const broadcastTaskUpdate = (io, projectId, eventName, payload) => {
  if (io) {
    io.to(`project:${projectId.toString()}`).emit(eventName, payload);
  }
};

module.exports = { recordActivity, pushNotification, broadcastTaskUpdate };
