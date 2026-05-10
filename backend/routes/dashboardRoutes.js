const express = require('express');
const dashboardRouter = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authGuard');

dashboardRouter.use(requireAuth);
dashboardRouter.get('/', getDashboardMetrics);

module.exports = dashboardRouter;
