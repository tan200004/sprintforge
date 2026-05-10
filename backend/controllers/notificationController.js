const SprintforgeNotification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /api/notifications
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filterQuery = { recipient: req.currentUser._id };
    if (unreadOnly === 'true') filterQuery.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      SprintforgeNotification.find(filterQuery)
        .populate('triggeredBy', 'fullName avatarUrl initials')
        .populate('linkedProject', 'name colorTag')
        .populate('linkedTask', 'title taskCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SprintforgeNotification.countDocuments({ recipient: req.currentUser._id, isRead: false }),
    ]);

    return sendSuccess(res, { notifications, unreadCount });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/notifications/:notifId/read
const markNotificationRead = async (req, res) => {
  try {
    await SprintforgeNotification.findOneAndUpdate(
      { _id: req.params.notifId, recipient: req.currentUser._id },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, 'Notification marked as read');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/notifications/read-all
const markAllNotificationsRead = async (req, res) => {
  try {
    await SprintforgeNotification.updateMany(
      { recipient: req.currentUser._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// DELETE /api/notifications/:notifId
const deleteNotification = async (req, res) => {
  try {
    await SprintforgeNotification.findOneAndDelete({
      _id: req.params.notifId,
      recipient: req.currentUser._id,
    });
    return sendSuccess(res, null, 'Notification deleted');
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
