const SprintforgeTask = require('../models/Task');
const SprintforgeProject = require('../models/Project');
const { recordActivity, pushNotification, broadcastTaskUpdate } = require('../services/realtimeService');
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendForbidden,
} = require('../utils/responseHandler');

// GET /api/tasks?projectId=xxx&status=xxx&priority=xxx&assignee=xxx
const listTasks = async (req, res) => {
  try {
    const { projectId, columnStatus, priorityLevel, assignee, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filterQuery = {};
    if (projectId) filterQuery.project = projectId;
    if (columnStatus) filterQuery.columnStatus = columnStatus;
    if (priorityLevel) filterQuery.priorityLevel = priorityLevel;
    if (assignee) filterQuery.assignees = assignee;
    if (search) filterQuery.title = { $regex: search, $options: 'i' };

    const [tasks, totalCount] = await Promise.all([
      SprintforgeTask.find(filterQuery)
        .populate('assignees', 'fullName avatarUrl initials')
        .populate('reporter', 'fullName avatarUrl initials')
        .sort({ columnPosition: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean({ virtuals: true }),
      SprintforgeTask.countDocuments(filterQuery),
    ]);

    return sendSuccess(res, {
      tasks,
      pagination: { currentPage: parseInt(page), totalCount },
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const {
      title, description, projectId, assignees, dueDate,
      priorityLevel, labels, storyPoints, estimatedHours, sprintName,
    } = req.body;

    const targetProject = await SprintforgeProject.findById(projectId);
    if (!targetProject) return sendNotFound(res, 'Project');

    const newTask = await SprintforgeTask.create({
      title,
      description,
      project: projectId,
      reporter: req.currentUser._id,
      assignees: assignees || [],
      dueDate,
      priorityLevel: priorityLevel || 'medium',
      labels: labels || [],
      storyPoints,
      estimatedHours,
      sprintName,
    });

    await newTask.populate('assignees', 'fullName avatarUrl initials');
    await newTask.populate('reporter', 'fullName avatarUrl initials');

    // Update project task count
    await SprintforgeProject.findByIdAndUpdate(projectId, {
      $inc: { 'taskSummary.total': 1 },
    });

    await recordActivity({
      actor: req.currentUser._id,
      actionType: 'created_task',
      entityKind: 'Task',
      entityId: newTask._id,
      entityTitle: newTask.title,
      relatedProject: projectId,
      humanReadableSummary: `${req.currentUser.fullName} created task "${newTask.title}"`,
    });

    // Notify assignees
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        if (assigneeId.toString() !== req.currentUser._id.toString()) {
          await pushNotification(req.io, {
            recipient: assigneeId,
            triggeredBy: req.currentUser._id,
            eventType: 'task_assigned',
            headline: `You've been assigned to "${newTask.title}"`,
            bodyText: `${req.currentUser.fullName} assigned you to this task.`,
            linkedProject: projectId,
            linkedTask: newTask._id,
            deepLinkUrl: `/projects/${projectId}/tasks/${newTask._id}`,
          });
        }
      }
    }

    broadcastTaskUpdate(req.io, projectId, 'forge:task:created', { task: newTask });

    return sendCreated(res, { task: newTask }, 'Task created successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// GET /api/tasks/:taskId
const getTaskById = async (req, res) => {
  try {
    const task = await SprintforgeTask.findById(req.params.taskId)
      .populate('assignees', 'fullName avatarUrl initials email')
      .populate('reporter', 'fullName avatarUrl initials email')
      .populate('project', 'name colorTag');

    if (!task) return sendNotFound(res, 'Task');
    return sendSuccess(res, { task });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/tasks/:taskId
const updateTask = async (req, res) => {
  try {
    const task = await SprintforgeTask.findById(req.params.taskId);
    if (!task) return sendNotFound(res, 'Task');

    const previousStatus = task.columnStatus;
    const updatableFields = [
      'title', 'description', 'columnStatus', 'priorityLevel',
      'assignees', 'dueDate', 'labels', 'storyPoints',
      'estimatedHours', 'isBlocked', 'blockReason', 'sprintName',
    ];

    const changedFields = {};
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        changedFields[field] = { from: task[field], to: req.body[field] };
        task[field] = req.body[field];
      }
    });

    await task.save();
    await task.populate('assignees', 'fullName avatarUrl initials');
    await task.populate('reporter', 'fullName avatarUrl initials');

    // Track status change
    if (req.body.columnStatus && req.body.columnStatus !== previousStatus) {
      await recordActivity({
        actor: req.currentUser._id,
        actionType: 'moved_task',
        entityKind: 'Task',
        entityId: task._id,
        entityTitle: task.title,
        relatedProject: task.project,
        changeDetails: { fieldChanged: 'columnStatus', previousValue: previousStatus, newValue: task.columnStatus },
        humanReadableSummary: `${req.currentUser.fullName} moved "${task.title}" from ${previousStatus} to ${task.columnStatus}`,
      });

      if (task.columnStatus === 'completed') {
        await SprintforgeProject.findByIdAndUpdate(task.project, {
          $inc: { 'taskSummary.completed': 1 },
        });
      }
    } else {
      await recordActivity({
        actor: req.currentUser._id,
        actionType: 'updated_task',
        entityKind: 'Task',
        entityId: task._id,
        entityTitle: task.title,
        relatedProject: task.project,
        humanReadableSummary: `${req.currentUser.fullName} updated task "${task.title}"`,
      });
    }

    broadcastTaskUpdate(req.io, task.project.toString(), 'forge:task:updated', { task });

    return sendSuccess(res, { task }, 'Task updated successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/tasks/:taskId/move
const moveTaskColumn = async (req, res) => {
  try {
    const { targetColumn, newPosition } = req.body;
    const task = await SprintforgeTask.findById(req.params.taskId);
    if (!task) return sendNotFound(res, 'Task');

    const previousColumn = task.columnStatus;
    task.columnStatus = targetColumn;
    if (newPosition !== undefined) task.columnPosition = newPosition;
    await task.save();

    await recordActivity({
      actor: req.currentUser._id,
      actionType: 'moved_task',
      entityKind: 'Task',
      entityId: task._id,
      entityTitle: task.title,
      relatedProject: task.project,
      changeDetails: { fieldChanged: 'columnStatus', previousValue: previousColumn, newValue: targetColumn },
      humanReadableSummary: `${req.currentUser.fullName} moved "${task.title}" to ${targetColumn}`,
    });

    broadcastTaskUpdate(req.io, task.project.toString(), 'forge:task:moved', {
      taskId: task._id,
      targetColumn,
      newPosition,
    });

    return sendSuccess(res, { task }, 'Task moved successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// DELETE /api/tasks/:taskId
const deleteTask = async (req, res) => {
  try {
    const task = await SprintforgeTask.findById(req.params.taskId);
    if (!task) return sendNotFound(res, 'Task');

    const canDelete =
      req.currentUser.role === 'admin' ||
      task.reporter.equals(req.currentUser._id);

    if (!canDelete) return sendForbidden(res, 'Only the task reporter or admin can delete this task');

    await SprintforgeProject.findByIdAndUpdate(task.project, {
      $inc: { 'taskSummary.total': -1 },
    });

    broadcastTaskUpdate(req.io, task.project.toString(), 'forge:task:deleted', { taskId: task._id });

    await task.deleteOne();

    return sendSuccess(res, null, 'Task deleted');
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  moveTaskColumn,
  deleteTask,
};
