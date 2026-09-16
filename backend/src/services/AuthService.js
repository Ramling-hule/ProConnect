import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import EmailService from "./EmailService.js";
import CacheService from "./CacheService.js";
import * as otplib from "otplib";
const { authenticator } = otplib;
import QRCode from "qrcode";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(env.googleClientId);
const sha256 = (plainText) => crypto.createHash("sha256").update(plainText).digest("hex");
class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        version: user.tokenVersion || 1 
      },
      env.jwtSecret,
      { 
        expiresIn: env.jwtExpire,
        issuer: "proconnect-api",
        audience: "proconnect-client",
        jwtid: crypto.randomUUID()
      }
    );
  }
  async _createSession(user, deviceInfo) {
    const sessionId = crypto.randomUUID();
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = sha256(rawRefreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deviceInfo,
    });

    await CacheService.setSession(user._id, sessionId, 30 * 24 * 60 * 60, {
      tokenVersion: user.tokenVersion || 1,
      ip: deviceInfo.ipAddress,
    });

    return { accessToken, rawRefreshToken, sessionId };
  }

  async register({ name, username, institute, email, password, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      const error = new Error("An account with this email already exists.");
      error.status = 400;
      throw error;
    }

    const otp = crypto.randomInt(1000, 9999).toString();
    const otpHash = sha256(otp);

    const validRoles = ["student", "admin", "institute", "mentor", "STUDENT", "MENTOR", "ADMIN"];
    const userRole = validRoles.includes(role) ? role : "student";

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.username = username;
      existingUser.institute = institute;
      existingUser.password = password;
      existingUser.verificationOtpHash = otpHash;
      existingUser.verificationOtpExpires = Date.now() + 10 * 60 * 1000;
      existingUser.verificationAttempts = 0;
      existingUser.role = userRole;
      await EmailService.sendOtpEmail(email, otp);
      await existingUser.save();
      return existingUser._id;
    }

    const newUser = new User({
      name,
      username,
      institute,
      email,
      password,
      role: userRole,
      isVerified: false,
      verificationOtpHash: otpHash,
      verificationOtpExpires: Date.now() + 10 * 60 * 1000,
      verificationAttempts: 0
    });
    await EmailService.sendOtpEmail(email, otp);
    await newUser.save();

    return newUser._id;
  }

  async verifyEmail({ userId, code }) {
    const user = await User.findById(userId);
    if (!user) throw { status: 400, message: "User not found" };
    if (user.isVerified) throw { status: 400, message: "User already verified" };

    if (user.verificationAttempts >= 5) {
      throw { status: 400, message: "Too many failed verification attempts. Please register again.", code: "MAX_ATTEMPTS" };
    }

    if (user.verificationCode && user.verificationCodeExpires) {
      const bcrypt = await import("bcryptjs");
      if (user.verificationCodeExpires < Date.now()) throw { status: 400, message: "Verification code expired" };
      const isMatch = await bcrypt.default.compare(code, user.verificationCode);
      if (!isMatch) {
        user.verificationAttempts += 1;
        await user.save();
        throw { status: 400, message: "Invalid code" };
      }
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
    } else {
      if (!user.verificationOtpExpires || user.verificationOtpExpires < Date.now()) throw { status: 400, message: "Verification OTP expired" };
      const hashedInput = sha256(code);
      if (hashedInput !== user.verificationOtpHash) {
        user.verificationAttempts += 1;
        await user.save();
        throw { status: 400, message: "Invalid OTP" };
      }
      user.verificationOtpHash = undefined;
      user.verificationOtpExpires = undefined;
    }

    user.isVerified = true;
    user.verificationAttempts = 0;
    await user.save();

    return user;
  }

  async login({ email, password, role, deviceInfo }) {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      throw { status: 401, message: "Account not found. Please create your account first." };
    }
    if (role && user.role && user.role.toLowerCase() !== role.toLowerCase()) {
       throw { status: 403, message: `Account exists, but not as a ${role}.` };
    }

    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      throw { status: 423, message: `Account is locked. Please try again in ${remaining} minutes.` };
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = Date.now() + 15 * 60 * 1000;
        await user.save();
        throw { status: 401, message: "Invalid email or password", locked: true, userId: user._id };
      }
      await user.save();
      throw { status: 401, message: "Invalid email or password", userId: user._id };
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;

    if (user.mfaEnabled) {
      const tempToken = crypto.randomBytes(32).toString("hex");
      user.tempMfaToken = tempToken;
      await user.save();
      return { mfaRequired: true, tempToken, userId: user._id };
    }

    await user.save();

    const session = await this._createSession(user, deviceInfo);
    return { user, ...session };
  }

  async setupMfa(userId) {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "User not found" };

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'ProConnect', secret);
    const qrCodeImage = await QRCode.toDataURL(otpauthUrl);

    user.mfaSecret = secret;
    user.mfaEnabled = false;
    await user.save();

    return { secret, qrCodeImage };
  }

  async enableMfa(userId, code) {
    const user = await User.findById(userId);
    if (!user || !user.mfaSecret) throw { status: 400, message: "MFA setup not initiated" };

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) throw { status: 400, message: "Invalid MFA code" };

    user.mfaEnabled = true;
    await user.save();
    return true;
  }

  async verifyMfaLogin({ userId, tempToken, code, deviceInfo }) {
    const user = await User.findById(userId);
    if (!user) throw { status: 401, message: "Invalid session" };

    if (user.tempMfaToken !== tempToken) throw { status: 401, message: "Invalid or expired session" };

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      user.failedLoginAttempts += 1;
      await user.save();
      throw { status: 401, message: "Invalid MFA code" };
    }

    user.failedLoginAttempts = 0;
    user.tempMfaToken = undefined;
    await user.save();

    const session = await this._createSession(user, deviceInfo);
    return { user, ...session };
  }

  async googleSignIn({ credential, deviceInfo }) {
    if (!credential) throw { status: 400, message: "Google credential is required" };
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      throw { status: 401, message: "Invalid Google token" };
    }
    
    const { email, name, sub, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        googleId: sub,
        username: email.split('@')[0] + crypto.randomInt(1000, 9999),
        institute: "Google Auth",
        isVerified: true,
        password: crypto.randomBytes(16).toString("hex"),
        profilePicture: picture || ""
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    if (user.mfaEnabled) {
      const tempToken = crypto.randomBytes(32).toString("hex");
      user.tempMfaToken = tempToken;
      await user.save();
      return { mfaRequired: true, tempToken, userId: user._id };
    }

    const session = await this._createSession(user, deviceInfo);
    return { user, ...session };
  }

  async rotateRefreshToken(rawToken, deviceInfo) {
    if (!rawToken) throw { status: 401, message: "Refresh token required" };

    const tokenHash = sha256(rawToken);
    const tokenDoc = await RefreshToken.findOne({ tokenHash }).populate("user");
    if (!tokenDoc) throw { status: 401, message: "Invalid refresh token" };

    const user = tokenDoc.user;

    if (tokenDoc.isUsed || tokenDoc.isRevoked) {
      await RefreshToken.deleteMany({ user: user._id });
      await CacheService.deleteSession(user._id);
      throw { status: 401, message: "Security threat detected. Sessions invalidated.", reuseAttempt: true, user, tokenHash };
    }

    if (tokenDoc.expiresAt < Date.now()) throw { status: 401, message: "Expired refresh token" };

    tokenDoc.isUsed = true;
    await tokenDoc.save();

    const newAccessToken = this.generateAccessToken(user);
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newRefreshHash = sha256(newRawRefreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash: newRefreshHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      parentTokenHash: tokenHash,
      deviceInfo
    });

    return { user, newAccessToken, newRawRefreshToken };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) return null;

    const otp = crypto.randomInt(1000, 9999).toString();
    const hash = sha256(otp);

    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await EmailService.sendPasswordResetOtpEmail(email, otp);
    
    return user;
  }

  async resetPassword({ email, otp, password }) {
    const user = await User.findOne({ email });
    if (!user) throw { status: 400, message: "Invalid request" };

    if (!user.passwordResetTokenHash || user.passwordResetExpires < Date.now()) {
      throw { status: 400, message: "Reset OTP expired or invalid" };
    }

    const otpHash = sha256(otp);
    if (otpHash !== user.passwordResetTokenHash) {
      throw { status: 400, message: "Invalid reset OTP" };
    }

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    await user.save();

    await RefreshToken.deleteMany({ user: user._id });
    await CacheService.deleteSession(user._id);

    return user;
  }

  async logout(rawToken, ip) {
    if (rawToken) {
      const hash = sha256(rawToken);
      const tokenDoc = await RefreshToken.findOneAndDelete({ tokenHash: hash });
      if (tokenDoc) {
        await CacheService.deleteSessionByIp(tokenDoc.user, ip);
        return tokenDoc.user;
      }
    }
    return null;
  }

  async logoutAllDevices(userId) {
    await RefreshToken.deleteMany({ user: userId });
    const user = await User.findById(userId);
    if (user) {
      user.tokenVersion = (user.tokenVersion || 1) + 1;
      await user.save();
    }
    await CacheService.deleteSession(userId);
  }
}

export default new AuthService();
