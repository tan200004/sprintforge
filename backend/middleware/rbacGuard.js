const { sendForbidden } = require('../utils/responseHandler');

/**
 * Factory: restrict access to one or more roles
 * Usage: restrictTo('admin', 'project_manager')
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.currentUser) {
      return sendForbidden(res, 'Authentication required');
    }
    if (!allowedRoles.includes(req.currentUser.role)) {
      return sendForbidden(
        res,
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }
    next();
  };
};

/**
 * Verify the requesting user is an admin
 */
const adminOnly = restrictTo('admin');

/**
 * Verify the requesting user is a project manager or above
 */
const managerOrAbove = restrictTo('admin', 'project_manager');

/**
 * Ensure the user can only modify their own resource (or is admin)
 */
const selfOrAdmin = (userIdField = 'id') => {
  return (req, res, next) => {
    const targetId = req.params[userIdField];
    const isOwnResource = req.currentUser._id.toString() === targetId;
    const isAdmin = req.currentUser.role === 'admin';

    if (!isOwnResource && !isAdmin) {
      return sendForbidden(res, 'You can only modify your own resources');
    }
    next();
  };
};

module.exports = { restrictTo, adminOnly, managerOrAbove, selfOrAdmin };
