const { verifyAccessToken } = require('../utils/tokenHelper');
const SprintforgeUser = require('../models/User');
const { sendUnauthorized, sendForbidden } = require('../utils/responseHandler');

/**
 * Verifies JWT access token and attaches the authenticated user to req.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No authentication token provided');
    }

    const rawToken = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(rawToken);

    const authenticatedUser = await SprintforgeUser.findById(decoded.uid).select(
      '-passwordHash -refreshToken -emailVerificationToken -passwordResetToken'
    );

    if (!authenticatedUser) {
      return sendUnauthorized(res, 'Account no longer exists');
    }

    if (authenticatedUser.accountStatus === 'suspended') {
      return sendForbidden(res, 'Your account has been suspended. Please contact support.');
    }

    req.currentUser = authenticatedUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Session expired. Please log in again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Invalid authentication token');
    }
    return sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Optional auth — attaches user if token present, continues regardless
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(rawToken);
      const user = await SprintforgeUser.findById(decoded.uid).select('-passwordHash');
      if (user) req.currentUser = user;
    }
  } catch (_) {
    // Silently ignore — optional
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
