const express = require('express');
const taskRouter = express.Router();

const {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  moveTaskColumn,
  deleteTask,
} = require('../controllers/taskController');

const { requireAuth } = require('../middleware/authGuard');
const sprintforgeUploader = require('../middleware/uploadHandler');

taskRouter.use(requireAuth);

taskRouter.get('/', listTasks);
taskRouter.post('/', createTask);
taskRouter.get('/:taskId', getTaskById);
taskRouter.put('/:taskId', updateTask);
taskRouter.put('/:taskId/move', moveTaskColumn);
taskRouter.delete('/:taskId', deleteTask);

module.exports = taskRouter;
