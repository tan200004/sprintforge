const SprintforgeProject = require('../models/Project');
const SprintforgeTask = require('../models/Task');
const SprintforgeUser = require('../models/User');
const { recordActivity, pushNotification } = require('../services/realtimeService');
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendForbidden,
} = require('../utils/responseHandler');

// GET /api/projects
const listProjects = async (req, res) => {
  try {
    const { status, search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filterQuery = {};

    if (req.currentUser.role !== 'admin') {
      filterQuery.$or = [
        { owner: req.currentUser._id },
        { 'members.user': req.currentUser._id },
      ];
    }

    if (status) filterQuery.status = status;
    if (search) filterQuery.name = { $regex: search, $options: 'i' };

    const sortDirection = order === 'asc' ? 1 : -1;

    const [projects, totalCount] = await Promise.all([
      SprintforgeProject.find(filterQuery)
        .populate('owner', 'fullName avatarUrl initials')
        .populate('members.user', 'fullName avatarUrl initials')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .lean({ virtuals: true }),
      SprintforgeProject.countDocuments(filterQuery),
    ]);

    return sendSuccess(res, {
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNextPage: skip + projects.length < totalCount,
      },
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, deadline, colorTag, tags, estimatedHours, repositoryUrl, websiteUrl } = req.body;

    const newProject = await SprintforgeProject.create({
      name,
      description,
      deadline,
      colorTag,
      tags,
      estimatedHours,
      repositoryUrl,
      websiteUrl,
      owner: req.currentUser._id,
      members: [{ user: req.currentUser._id, role: 'lead' }],
    });

    await newProject.populate('owner', 'fullName avatarUrl initials');

    await recordActivity({
      actor: req.currentUser._id,
      actionType: 'created_project',
      entityKind: 'Project',
      entityId: newProject._id,
      entityTitle: newProject.name,
      relatedProject: newProject._id,
      humanReadableSummary: `${req.currentUser.fullName} created project "${newProject.name}"`,
    });

    return sendCreated(res, { project: newProject }, 'Project created successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// GET /api/projects/:projectId
const getProjectById = async (req, res) => {
  try {
    const project = await SprintforgeProject.findById(req.params.projectId)
      .populate('owner', 'fullName avatarUrl initials email role')
      .populate('members.user', 'fullName avatarUrl initials email role');

    if (!project) return sendNotFound(res, 'Project');

    const isMember =
      req.currentUser.role === 'admin' ||
      project.owner.equals(req.currentUser._id) ||
      project.members.some((m) => m.user._id.equals(req.currentUser._id));

    if (!isMember) return sendForbidden(res, 'You are not a member of this project');

    return sendSuccess(res, { project });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/projects/:projectId
const updateProject = async (req, res) => {
  try {
    const project = await SprintforgeProject.findById(req.params.projectId);
    if (!project) return sendNotFound(res, 'Project');

    const canEdit =
      req.currentUser.role === 'admin' ||
      project.owner.equals(req.currentUser._id) ||
      project.members.some(
        (m) => m.user.equals(req.currentUser._id) && m.role === 'lead'
      );

    if (!canEdit) return sendForbidden(res, 'Only project leads can edit this project');

    const updatableFields = ['name', 'description', 'status', 'deadline', 'colorTag', 'tags', 'estimatedHours', 'repositoryUrl', 'websiteUrl', 'startDate'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    await project.save();
    await project.populate('owner', 'fullName avatarUrl initials');
    await project.populate('members.user', 'fullName avatarUrl initials');

    await recordActivity({
      actor: req.currentUser._id,
      actionType: 'updated_project',
      entityKind: 'Project',
      entityId: project._id,
      entityTitle: project.name,
      relatedProject: project._id,
      humanReadableSummary: `${req.currentUser.fullName} updated project "${project.name}"`,
    });

    return sendSuccess(res, { project }, 'Project updated');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// DELETE /api/projects/:projectId
const deleteProject = async (req, res) => {
  try {
    const project = await SprintforgeProject.findById(req.params.projectId);
    if (!project) return sendNotFound(res, 'Project');

    const canDelete =
      req.currentUser.role === 'admin' ||
      project.owner.equals(req.currentUser._id);

    if (!canDelete) return sendForbidden(res, 'Only the project owner or admin can delete this project');

    await SprintforgeTask.deleteMany({ project: project._id });
    await project.deleteOne();

    return sendSuccess(res, null, 'Project and all associated tasks have been deleted');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/projects/:projectId/members
const addProjectMember = async (req, res) => {
  try {
    const { userId, memberRole = 'contributor' } = req.body;
    const project = await SprintforgeProject.findById(req.params.projectId);
    if (!project) return sendNotFound(res, 'Project');

    const canManage =
      req.currentUser.role === 'admin' ||
      project.owner.equals(req.currentUser._id);

    if (!canManage) return sendForbidden(res);

    const targetUser = await SprintforgeUser.findById(userId);
    if (!targetUser) return sendNotFound(res, 'User');

    const alreadyMember = project.members.some((m) => m.user.equals(userId));
    if (alreadyMember) return sendError(res, 'User is already a project member', 409);

    project.members.push({ user: userId, role: memberRole });
    await project.save();

    await pushNotification(req.io, {
      recipient: userId,
      triggeredBy: req.currentUser._id,
      eventType: 'project_member_added',
      headline: `You've been added to "${project.name}"`,
      bodyText: `${req.currentUser.fullName} added you as a ${memberRole} in this project.`,
      linkedProject: project._id,
      deepLinkUrl: `/projects/${project._id}`,
    });

    return sendSuccess(res, null, 'Member added to project');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// DELETE /api/projects/:projectId/members/:userId
const removeProjectMember = async (req, res) => {
  try {
    const project = await SprintforgeProject.findById(req.params.projectId);
    if (!project) return sendNotFound(res, 'Project');

    const canManage =
      req.currentUser.role === 'admin' ||
      project.owner.equals(req.currentUser._id);

    if (!canManage) return sendForbidden(res);

    project.members = project.members.filter(
      (m) => !m.user.equals(req.params.userId)
    );
    await project.save();

    return sendSuccess(res, null, 'Member removed from project');
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};
