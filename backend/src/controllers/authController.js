import AuthService from "../services/AuthService.js";
import AuditService from "../services/AuditService.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
const getDeviceInfo = (req) => ({
  ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  userAgent: req.headers["user-agent"],
});
const setRefreshCookie = (res, rawRefreshToken) => {
  res.cookie("refreshToken", rawRefreshToken, {
    httpOnly: true,
    secure:   env.nodeEnv === "production",
    sameSite: "lax",
    path:     "/api/auth/refresh-token",
    maxAge:   30 * 24 * 60 * 60 * 1000,
  });
};
const formatUserResponse = (user) => ({
  _id:        user._id,
  name:       user.name,
  username:   user.username,
  email:      user.email,
  institute:  user.institute,
  role:       user.role,
});
export const registerUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = await AuthService.register(req.body);
    await AuditService.log(userId, "REGISTRATION_SUCCESS", req);
    res.status(201).json({ message: "Verification OTP sent", userId });
  } catch (error) {
    if (error.status === 400 && error.message === "User already exists") {
      await AuditService.log(null, "REGISTRATION_ATTEMPT", req, {
        email: req.body.email,
        reason: "Email already exists",
      });
    }
    throw new AppError(error.message, error.status || 500);
  }
});
export const verifyEmail = asyncHandler(async (req, res, next) => {
  try {
    const user = await AuthService.verifyEmail(req.body);
    await AuditService.log(user._id, "EMAIL_VERIFICATION_SUCCESS", req);
    res.status(200).json({ message: "Account verified successfully. Please login." });
  } catch (error) {
    throw new AppError(error.message, error.status || 500);
  }
});
export const loginUser = asyncHandler(async (req, res, next) => {
  try {
    const result = await AuthService.login({ ...req.body, deviceInfo: getDeviceInfo(req) });

    if (result.mfaRequired) {
      return res.json({ mfaRequired: true, tempToken: result.tempToken, userId: result.userId });
    }

    setRefreshCookie(res, result.rawRefreshToken);
    await AuditService.log(result.user._id, "LOGIN_SUCCESS", req, { sessionId: result.sessionId });
    res.json({ accessToken: result.accessToken, user: formatUserResponse(result.user) });
  } catch (error) {
    if (error.userId) {
      await AuditService.log(error.userId, "LOGIN_FAILURE", req);
      if (error.locked) await AuditService.log(error.userId, "ACCOUNT_LOCKOUT", req);
    }
    throw new AppError(error.message, error.status || 500);
  }
});
export const rotateRefreshToken = asyncHandler(async (req, res, next) => {
  try {
    const result = await AuthService.rotateRefreshToken(
      req.cookies?.refreshToken,
      getDeviceInfo(req),
    );
    setRefreshCookie(res, result.newRawRefreshToken);
    await AuditService.log(result.user._id, "REFRESH_TOKEN_SUCCESS", req);
    res.json({ accessToken: result.newAccessToken });
  } catch (error) {
    if (error.reuseAttempt) {
      await AuditService.log(error.user._id, "REFRESH_TOKEN_REUSE_ATTEMPT", req, { tokenHash: error.tokenHash });
      res.clearCookie("refreshToken");
    }
    throw new AppError(error.message, error.status || 500);
  }
});
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await AuthService.forgotPassword(req.body.email);
  if (user) await AuditService.log(user._id, "PASSWORD_RESET_REQUESTED", req);
  res.status(200).json({ message: "If that email exists, an OTP has been sent." });
});
export const resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const user = await AuthService.resetPassword(req.body);
    await AuditService.log(user._id, "PASSWORD_RESET_COMPLETED", req);
    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    throw new AppError(error.message, error.status || 500);
  }
});
export const logoutUser = asyncHandler(async (req, res, next) => {
  const userId = await AuthService.logout(req.cookies?.refreshToken, req.ip);
  if (userId) await AuditService.log(userId, "LOGOUT_SUCCESS", req);
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});
export const logoutAllDevices = asyncHandler(async (req, res, next) => {
  await AuthService.logoutAllDevices(req.user._id);
  res.clearCookie("refreshToken");
  await AuditService.log(req.user._id, "LOGOUT_ALL_DEVICES", req);
  res.json({ message: "Logged out from all devices" });
});
export const setupMfa = asyncHandler(async (req, res, next) => {
  const result = await AuthService.setupMfa(req.user._id);
  res.json(result);
});
export const enableMfa = asyncHandler(async (req, res, next) => {
  await AuthService.enableMfa(req.user._id, req.body.code);
  res.json({ message: "MFA enabled successfully" });
});
export const verifyMfaLogin = asyncHandler(async (req, res, next) => {
  try {
    const result = await AuthService.verifyMfaLogin({ ...req.body, deviceInfo: getDeviceInfo(req) });
    setRefreshCookie(res, result.rawRefreshToken);
    await AuditService.log(result.user._id, "MFA_LOGIN_SUCCESS", req, { sessionId: result.sessionId });
    res.json({ accessToken: result.accessToken, user: formatUserResponse(result.user) });
  } catch (error) {
    if (error.userId) await AuditService.log(error.userId, "MFA_LOGIN_FAILURE", req);
    throw new AppError(error.message, error.status || 401);
  }
});
export const googleSignIn = asyncHandler(async (req, res, next) => {
  try {
    const result = await AuthService.googleSignIn({
      credential: req.body.credential,
      deviceInfo: getDeviceInfo(req),
    });

    if (result.mfaRequired) {
      return res.json({ mfaRequired: true, tempToken: result.tempToken, userId: result.userId });
    }

    setRefreshCookie(res, result.rawRefreshToken);
    await AuditService.log(result.user._id, "GOOGLE_LOGIN_SUCCESS", req, { sessionId: result.sessionId });
    res.json({ accessToken: result.accessToken, user: formatUserResponse(result.user) });
  } catch (error) {
    throw new AppError(error.message, error.status || 500);
  }
});