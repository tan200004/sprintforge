const SprintforgeActivity = require('../models/ActivityLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /api/activity
const getActivityFeed = async (req, res) => {
  try {
    const { projectId, actorId, page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filterQuery = {};
    if (projectId) filterQuery.relatedProject = projectId;
    if (actorId) filterQuery.actor = actorId;

    const [activities, totalCount] = await Promise.all([
      SprintforgeActivity.find(filterQuery)
        .populate('actor', 'fullName avatarUrl initials')
        .populate('relatedProject', 'name colorTag')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SprintforgeActivity.countDocuments(filterQuery),
    ]);

    return sendSuccess(res, {
      activities,
      pagination: { currentPage: parseInt(page), totalCount },
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = { getActivityFeed };
