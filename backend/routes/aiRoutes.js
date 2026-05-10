const express = require('express');
const aiRouter = express.Router();

const {
  generateTaskDescription,
  generateSprintSummary,
  explainBugDescription,
  summarizeMeetingNotes,
} = require('../controllers/aiController');

const { requireAuth } = require('../middleware/authGuard');

aiRouter.use(requireAuth);

aiRouter.post('/generate-description', generateTaskDescription);
aiRouter.post('/sprint-summary', generateSprintSummary);
aiRouter.post('/explain-bug', explainBugDescription);
aiRouter.post('/meeting-notes', summarizeMeetingNotes);

module.exports = aiRouter;
