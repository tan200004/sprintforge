const express = require('express');
const notifRouter = express.Router();

const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { requireAuth } = require('../middleware/authGuard');

notifRouter.use(requireAuth);

notifRouter.get('/', getUserNotifications);
notifRouter.put('/read-all', markAllNotificationsRead);
notifRouter.put('/:notifId/read', markNotificationRead);
notifRouter.delete('/:notifId', deleteNotification);

module.exports = notifRouter;
