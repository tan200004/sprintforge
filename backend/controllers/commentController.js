const SprintforgeComment = require('../models/Comment');
const SprintforgeTask = require('../models/Task');
const { recordActivity, pushNotification, broadcastTaskUpdate } = require('../services/realtimeService');
const { sendSuccess, sendCreated, sendError, sendNotFound, sendForbidden } = require('../utils/responseHandler');

// GET /api/comments/task/:taskId
const fetchTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await SprintforgeComment.find({
      parentTask: taskId,
      isDeleted: false,
    })
      .populate('author', 'fullName avatarUrl initials')
      .populate('mentions.user', 'fullName initials')
      .sort({ createdAt: 1 });

    return sendSuccess(res, { comments, total: comments.length });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/comments
const postComment = async (req, res) => {
  try {
    const { body, taskId, mentions } = req.body;

    const targetTask = await SprintforgeTask.findById(taskId);
    if (!targetTask) return sendNotFound(res, 'Task');

    const newComment = await SprintforgeComment.create({
      body,
      author: req.currentUser._id,
      parentTask: taskId,
      mentions: mentions || [],
    });

    await newComment.populate('author', 'fullName avatarUrl initials');

    await recordActivity({
      actor: req.currentUser._id,
      actionType: 'commented_on_task',
      entityKind: 'Comment',
      entityId: newComment._id,
      entityTitle: targetTask.title,
      relatedProject: targetTask.project,
      humanReadableSummary: `${req.currentUser.fullName} commented on "${targetTask.title}"`,
    });

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      for (const mention of mentions) {
        if (mention.user && mention.user.toString() !== req.currentUser._id.toString()) {
          await pushNotification(req.io, {
            recipient: mention.user,
            triggeredBy: req.currentUser._id,
            eventType: 'mention',
            headline: `${req.currentUser.fullName} mentioned you in "${targetTask.title}"`,
            bodyText: body.substring(0, 100),
            linkedTask: taskId,
            linkedProject: targetTask.project,
          });
        }
      }
    }

    broadcastTaskUpdate(req.io, targetTask.project.toString(), 'forge:comment:new', {
      comment: newComment,
      taskId,
    });

    return sendCreated(res, { comment: newComment });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/comments/:commentId
const editComment = async (req, res) => {
  try {
    const comment = await SprintforgeComment.findById(req.params.commentId);
    if (!comment) return sendNotFound(res, 'Comment');
    if (!comment.author.equals(req.currentUser._id)) return sendForbidden(res);

    comment.body = req.body.body;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('author', 'fullName avatarUrl initials');

    return sendSuccess(res, { comment }, 'Comment updated');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// DELETE /api/comments/:commentId
const removeComment = async (req, res) => {
  try {
    const comment = await SprintforgeComment.findById(req.params.commentId);
    if (!comment) return sendNotFound(res, 'Comment');

    const canDelete =
      comment.author.equals(req.currentUser._id) || req.currentUser.role === 'admin';
    if (!canDelete) return sendForbidden(res);

    comment.isDeleted = true;
    comment.body = '[This comment has been deleted]';
    await comment.save();

    return sendSuccess(res, null, 'Comment removed');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/comments/:commentId/react
const reactToComment = async (req, res) => {
  try {
    const { emoji } = req.body;
    const comment = await SprintforgeComment.findById(req.params.commentId);
    if (!comment) return sendNotFound(res, 'Comment');

    const existingReaction = comment.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      const alreadyReacted = existingReaction.reactedBy.includes(req.currentUser._id);
      if (alreadyReacted) {
        existingReaction.reactedBy = existingReaction.reactedBy.filter(
          (uid) => !uid.equals(req.currentUser._id)
        );
      } else {
        existingReaction.reactedBy.push(req.currentUser._id);
      }
    } else {
      comment.reactions.push({ emoji, reactedBy: [req.currentUser._id] });
    }

    await comment.save();
    return sendSuccess(res, { reactions: comment.reactions });
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = { fetchTaskComments, postComment, editComment, removeComment, reactToComment };
