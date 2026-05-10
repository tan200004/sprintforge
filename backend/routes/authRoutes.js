const express = require('express');
const authRouter = express.Router();

const {
  registerAccount,
  loginAccount,
  logoutAccount,
  refreshAccessToken,
  verifyEmailAddress,
  requestPasswordReset,
  executePasswordReset,
  getAuthenticatedUser,
} = require('../controllers/authController');

const { requireAuth } = require('../middleware/authGuard');

const {
  registerValidationRules,
  loginValidationRules,
  passwordResetValidationRules,
} = require('../validators/authValidators');

authRouter.post('/register', registerValidationRules, registerAccount);
authRouter.post('/login', loginValidationRules, loginAccount);
authRouter.post('/logout', logoutAccount);
authRouter.post('/refresh', refreshAccessToken);
authRouter.get('/verify-email/:token', verifyEmailAddress);
authRouter.post('/forgot-password', requestPasswordReset);
authRouter.post('/reset-password/:token', passwordResetValidationRules, executePasswordReset);
authRouter.get('/me', requireAuth, getAuthenticatedUser);

module.exports = authRouter;
