const express = require('express');
const projectRouter = express.Router();

const {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');

const { requireAuth } = require('../middleware/authGuard');
const { managerOrAbove, adminOnly } = require('../middleware/rbacGuard');

projectRouter.use(requireAuth);

projectRouter.get('/', listProjects);
projectRouter.post('/', managerOrAbove, createProject);
projectRouter.get('/:projectId', getProjectById);
projectRouter.put('/:projectId', managerOrAbove, updateProject);
projectRouter.delete('/:projectId', adminOnly, deleteProject);
projectRouter.post('/:projectId/members', managerOrAbove, addProjectMember);
projectRouter.delete('/:projectId/members/:userId', managerOrAbove, removeProjectMember);

module.exports = projectRouter;
