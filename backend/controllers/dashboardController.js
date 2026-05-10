const SprintforgeTask = require('../models/Task');
const SprintforgeProject = require('../models/Project');
const SprintforgeUser = require('../models/User');
const SprintforgeActivity = require('../models/ActivityLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /api/dashboard
const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.currentUser._id;
    const isAdmin = req.currentUser.role === 'admin';

    // Project filter based on role
    const projectFilter = isAdmin
      ? {}
      : { $or: [{ owner: userId }, { 'members.user': userId }] };

    const userProjects = await SprintforgeProject.find(projectFilter).select('_id status taskSummary deadline name colorTag');
    const projectIds = userProjects.map((p) => p._id);

    const taskFilter = isAdmin ? {} : { project: { $in: projectIds } };

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      assignedToMe,
      totalUsers,
      recentActivity,
    ] = await Promise.all([
      SprintforgeProject.countDocuments(isAdmin ? {} : projectFilter),
      SprintforgeProject.countDocuments({ ...projectFilter, status: 'active' }),
      SprintforgeProject.countDocuments({ ...projectFilter, status: 'completed' }),
      SprintforgeTask.countDocuments(taskFilter),
      SprintforgeTask.countDocuments({ ...taskFilter, columnStatus: 'completed' }),
      SprintforgeTask.countDocuments({ ...taskFilter, columnStatus: 'in_progress' }),
      SprintforgeTask.countDocuments({
        ...taskFilter,
        dueDate: { $lt: new Date() },
        columnStatus: { $ne: 'completed' },
      }),
      SprintforgeTask.countDocuments({ assignees: userId, columnStatus: { $ne: 'completed' } }),
      isAdmin ? SprintforgeUser.countDocuments() : 0,
      SprintforgeActivity.find(
        isAdmin ? {} : { relatedProject: { $in: projectIds } }
      )
        .populate('actor', 'fullName avatarUrl initials')
        .sort({ createdAt: -1 })
        .limit(15),
    ]);

    // Task completion rate over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyCompletionRaw = await SprintforgeTask.aggregate([
      {
        $match: {
          ...taskFilter,
          completedAt: { $gte: sevenDaysAgo },
          columnStatus: 'completed',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Workload per user (tasks assigned, not completed)
    const workloadBreakdown = await SprintforgeTask.aggregate([
      {
        $match: { project: { $in: projectIds }, columnStatus: { $ne: 'completed' } },
      },
      { $unwind: '$assignees' },
      {
        $group: { _id: '$assignees', taskCount: { $sum: 1 } },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'memberInfo',
        },
      },
      { $unwind: '$memberInfo' },
      {
        $project: {
          _id: 1,
          taskCount: 1,
          'memberInfo.fullName': 1,
          'memberInfo.avatarUrl': 1,
          'memberInfo.initials': 1,
        },
      },
      { $sort: { taskCount: -1 } },
      { $limit: 8 },
    ]);

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = await SprintforgeProject.find({
      ...projectFilter,
      deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })
      .select('name deadline status colorTag')
      .sort({ deadline: 1 })
      .limit(5);

    return sendSuccess(res, {
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        assignedToMe,
        totalUsers,
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      charts: {
        dailyCompletion: dailyCompletionRaw,
        workloadBreakdown,
      },
      recentActivity,
      upcomingDeadlines,
      projectOverview: userProjects.slice(0, 6),
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = { getDashboardMetrics };
