const express = require('express');
const activityRouter = express.Router();
const { getActivityFeed } = require('../controllers/activityController');
const { requireAuth } = require('../middleware/authGuard');

activityRouter.use(requireAuth);
activityRouter.get('/', getActivityFeed);

module.exports = activityRouter;
