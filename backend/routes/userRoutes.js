const express = require('express');
const userRouter = express.Router();

const {
  listAllUsers,
  getMyProfile,
  updateMyProfile,
  changeUserRole,
  changeUserStatus,
  getUserById,
} = require('../controllers/userController');

const { requireAuth } = require('../middleware/authGuard');
const { adminOnly } = require('../middleware/rbacGuard');
const sprintforgeUploader = require('../middleware/uploadHandler');

userRouter.use(requireAuth);

userRouter.get('/profile', getMyProfile);
userRouter.put('/profile', sprintforgeUploader.single('avatar'), updateMyProfile);
userRouter.get('/', adminOnly, listAllUsers);
userRouter.get('/:userId', getUserById);
userRouter.put('/:userId/role', adminOnly, changeUserRole);
userRouter.put('/:userId/status', adminOnly, changeUserStatus);

module.exports = userRouter;
