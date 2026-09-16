import express from 'express';
import { 
  registerUser, 
  loginUser, 
  verifyEmail, 
  rotateRefreshToken, 
  forgotPassword, 
  resetPassword, 
  logoutUser, 
  logoutAllDevices,
  setupMfa,
  enableMfa,
  verifyMfaLogin,
  googleSignIn
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { loginLimiter, registrationLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validateRequest.js';
import { 
  registerSchema, 
  loginSchema, 
  resetPasswordSchema, 
  verifyEmailSchema, 
  forgotPasswordSchema 
} from '../validations/auth.validation.js';

const router = express.Router();

router.post('/register', registrationLimiter, validate(registerSchema), registerUser);
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/refresh-token', rotateRefreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', logoutUser);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/mfa/setup', protect, setupMfa);
router.post('/mfa/enable', protect, enableMfa);
router.post('/login/mfa', loginLimiter, verifyMfaLogin);
router.post('/google', loginLimiter, googleSignIn);

export default router;