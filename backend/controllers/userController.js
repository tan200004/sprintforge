const SprintforgeUser = require('../models/User');
const { sendSuccess, sendError, sendNotFound, sendForbidden } = require('../utils/responseHandler');

// GET /api/users (admin only)
const listAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filterQuery = {};
    if (role) filterQuery.role = role;
    if (status) filterQuery.accountStatus = status;
    if (search) {
      filterQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      SprintforgeUser.find(filterQuery)
        .select('-passwordHash -refreshToken -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SprintforgeUser.countDocuments(filterQuery),
    ]);

    return sendSuccess(res, {
      users,
      pagination: { currentPage: parseInt(page), totalCount, totalPages: Math.ceil(totalCount / parseInt(limit)) },
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// GET /api/users/profile
const getMyProfile = async (req, res) => {
  try {
    const profile = await SprintforgeUser.findById(req.currentUser._id).select(
      '-passwordHash -refreshToken -emailVerificationToken -passwordResetToken'
    );
    return sendSuccess(res, { user: profile });
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/users/profile
const updateMyProfile = async (req, res) => {
  try {
    const allowedUpdates = ['fullName', 'bio', 'jobTitle', 'timezone', 'preferences'];
    const updatePayload = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updatePayload[field] = req.body[field];
    });

    if (req.file) {
      updatePayload.avatarUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await SprintforgeUser.findByIdAndUpdate(
      req.currentUser._id,
      updatePayload,
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshToken');

    return sendSuccess(res, { user: updatedUser }, 'Profile updated');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/users/:userId/role (admin only)
const changeUserRole = async (req, res) => {
  try {
    const { newRole } = req.body;
    const validRoles = ['admin', 'project_manager', 'member'];
    if (!validRoles.includes(newRole)) return sendError(res, 'Invalid role', 400);

    const targetUser = await SprintforgeUser.findByIdAndUpdate(
      req.params.userId,
      { role: newRole },
      { new: true }
    ).select('-passwordHash');

    if (!targetUser) return sendNotFound(res, 'User');
    return sendSuccess(res, { user: targetUser }, `Role updated to ${newRole}`);
  } catch (err) {
    return sendError(res, err.message);
  }
};

// PUT /api/users/:userId/status (admin only)
const changeUserStatus = async (req, res) => {
  try {
    const { newStatus } = req.body;
    const validStatuses = ['active', 'suspended', 'pending_verification'];
    if (!validStatuses.includes(newStatus)) return sendError(res, 'Invalid status', 400);

    const targetUser = await SprintforgeUser.findByIdAndUpdate(
      req.params.userId,
      { accountStatus: newStatus },
      { new: true }
    ).select('-passwordHash');

    if (!targetUser) return sendNotFound(res, 'User');
    return sendSuccess(res, { user: targetUser }, `Account status updated to ${newStatus}`);
  } catch (err) {
    return sendError(res, err.message);
  }
};

// GET /api/users/:userId
const getUserById = async (req, res) => {
  try {
    const user = await SprintforgeUser.findById(req.params.userId).select(
      'fullName email avatarUrl initials role jobTitle bio isOnline lastActiveAt'
    );
    if (!user) return sendNotFound(res, 'User');
    return sendSuccess(res, { user });
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = {
  listAllUsers,
  getMyProfile,
  updateMyProfile,
  changeUserRole,
  changeUserStatus,
  getUserById,
};
