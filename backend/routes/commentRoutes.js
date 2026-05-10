const express = require('express');
const commentRouter = express.Router();

const {
  fetchTaskComments,
  postComment,
  editComment,
  removeComment,
  reactToComment,
} = require('../controllers/commentController');

const { requireAuth } = require('../middleware/authGuard');

commentRouter.use(requireAuth);

commentRouter.get('/task/:taskId', fetchTaskComments);
commentRouter.post('/', postComment);
commentRouter.put('/:commentId', editComment);
commentRouter.delete('/:commentId', removeComment);
commentRouter.post('/:commentId/react', reactToComment);

module.exports = commentRouter;
