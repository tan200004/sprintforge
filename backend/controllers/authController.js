const SprintforgeUser = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
} = require('../utils/tokenHelper');
const {
  dispatchVerificationEmail,
  dispatchPasswordResetEmail,
} = require('../services/emailService');
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
  sendNotFound,
  sendValidationError,
} = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const extractValidationErrors = (req) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return result.array().map((e) => ({ field: e.path, message: e.msg }));
  }
  return null;
};

// POST /api/auth/register
const registerAccount = async (req, res) => {
  const validationErrors = extractValidationErrors(req);
  if (validationErrors) return sendValidationError(res, validationErrors);

  try {
    const { fullName, email, password, role } = req.body;

    const existingUser = await SprintforgeUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    const verificationToken = generateSecureToken();
    const hashedVerificationToken = hashToken(verificationToken);

    const newUser = await SprintforgeUser.create({
      fullName,
      email,
      passwordHash: password,
      role: role || 'member',
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    try {
      await dispatchVerificationEmail(newUser.email, newUser.fullName, verificationLink);
    } catch (emailErr) {
      console.warn('⚠️  Verification email failed:', emailErr.message);
    }

    return sendCreated(
      res,
      { userId: newUser._id, email: newUser.email },
      'Account created. Please check your email to verify your account.'
    );
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/auth/login
const loginAccount = async (req, res) => {
  const validationErrors = extractValidationErrors(req);
  if (validationErrors) return sendValidationError(res, validationErrors);

  try {
    const { email, password } = req.body;

    const foundUser = await SprintforgeUser.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash +refreshToken'
    );

    if (!foundUser || !(await foundUser.comparePassword(password))) {
      return sendUnauthorized(res, 'Invalid email or password');
    }

    if (!foundUser.emailVerified) {
      return sendError(res, 'Please verify your email before logging in', 403);
    }

    if (foundUser.accountStatus === 'suspended') {
      return sendError(res, 'Your account has been suspended. Contact support.', 403);
    }

    const accessToken = generateAccessToken(foundUser._id, foundUser.role);
    const refreshToken = generateRefreshToken(foundUser._id);

    foundUser.refreshToken = hashToken(refreshToken);
    foundUser.lastActiveAt = new Date();
    foundUser.isOnline = true;
    await foundUser.save();

    res.cookie('sf_refresh_token', refreshToken, TOKEN_COOKIE_OPTIONS);

    return sendSuccess(res, {
      accessToken,
      user: {
        id: foundUser._id,
        fullName: foundUser.fullName,
        email: foundUser.email,
        role: foundUser.role,
        avatarUrl: foundUser.avatarUrl,
        initials: foundUser.initials,
        preferences: foundUser.preferences,
      },
    }, 'Logged in successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/auth/logout
const logoutAccount = async (req, res) => {
  try {
    const refreshToken = req.cookies?.sf_refresh_token;
    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);
      await SprintforgeUser.findOneAndUpdate(
        { refreshToken: hashedToken },
        { refreshToken: null, isOnline: false }
      );
    }
    res.clearCookie('sf_refresh_token');
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/auth/refresh
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.sf_refresh_token;
    if (!incomingRefreshToken) {
      return sendUnauthorized(res, 'Refresh token not found');
    }

    const decoded = verifyRefreshToken(incomingRefreshToken);
    const hashedToken = hashToken(incomingRefreshToken);

    const tokenOwner = await SprintforgeUser.findOne({
      _id: decoded.uid,
      refreshToken: hashedToken,
    });

    if (!tokenOwner) {
      return sendUnauthorized(res, 'Invalid or expired refresh token');
    }

    const newAccessToken = generateAccessToken(tokenOwner._id, tokenOwner.role);
    const newRefreshToken = generateRefreshToken(tokenOwner._id);

    tokenOwner.refreshToken = hashToken(newRefreshToken);
    await tokenOwner.save();

    res.cookie('sf_refresh_token', newRefreshToken, TOKEN_COOKIE_OPTIONS);

    return sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (err) {
    return sendUnauthorized(res, 'Session expired. Please log in again.');
  }
};

// GET /api/auth/verify-email/:token
const verifyEmailAddress = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = hashToken(token);

    const targetUser = await SprintforgeUser.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!targetUser) {
      return sendError(res, 'Verification link is invalid or has expired', 400);
    }

    targetUser.emailVerified = true;
    targetUser.accountStatus = 'active';
    targetUser.emailVerificationToken = undefined;
    targetUser.emailVerificationExpires = undefined;
    await targetUser.save();

    return sendSuccess(res, null, 'Email verified successfully. You can now log in.');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/auth/forgot-password
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const targetUser = await SprintforgeUser.findOne({ email: email?.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!targetUser) {
      return sendSuccess(res, null, 'If an account exists with that email, a reset link has been sent.');
    }

    const resetToken = generateSecureToken();
    const hashedReset = hashToken(resetToken);

    targetUser.passwordResetToken = hashedReset;
    targetUser.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await targetUser.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await dispatchPasswordResetEmail(targetUser.email, targetUser.fullName, resetLink);
    } catch (emailErr) {
      console.warn('⚠️  Password reset email failed:', emailErr.message);
    }

    return sendSuccess(res, null, 'If an account exists with that email, a reset link has been sent.');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// POST /api/auth/reset-password/:token
const executePasswordReset = async (req, res) => {
  const validationErrors = extractValidationErrors(req);
  if (validationErrors) return sendValidationError(res, validationErrors);

  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = hashToken(token);
    const targetUser = await SprintforgeUser.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!targetUser) {
      return sendError(res, 'Password reset link is invalid or has expired', 400);
    }

    targetUser.passwordHash = newPassword;
    targetUser.passwordResetToken = undefined;
    targetUser.passwordResetExpires = undefined;
    targetUser.refreshToken = null;
    await targetUser.save();

    res.clearCookie('sf_refresh_token');
    return sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// GET /api/auth/me
const getAuthenticatedUser = async (req, res) => {
  try {
    return sendSuccess(res, { user: req.currentUser });
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = {
  registerAccount,
  loginAccount,
  logoutAccount,
  refreshAccessToken,
  verifyEmailAddress,
  requestPasswordReset,
  executePasswordReset,
  getAuthenticatedUser,
};
