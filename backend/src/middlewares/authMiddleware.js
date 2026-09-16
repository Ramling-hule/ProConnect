import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redis.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.jwtSecret, {
        issuer: 'proconnect-api',
        audience: 'proconnect-client'
      });
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'Not authorized, user not found' });
      }
      if (user.lockedUntil && user.lockedUntil > Date.now()) {
        return res.status(423).json({ error: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked due to failed login attempts.' });
      }
      if (decoded.version !== (user.tokenVersion || 1)) {
        return res.status(401).json({ error: 'TOKEN_REVOKED', message: 'This token has been revoked.' });
      }
      if (redisClient.isReady) {
        const sessionKeys = await redisClient.keys(`session:active:${user._id}:*`);
        if (sessionKeys.length === 0) {
          return res.status(401).json({ error: 'SESSION_EXPIRED', message: 'No active session found.' });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      const errorMsg = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      res.status(401).json({ error: errorMsg, message: error.message });
    }
  } else {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authorized, no token' });
  }
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'User role not authorized' });
    }
    next();
  };
};
export const authenticate = protect;
export const authorize = authorizeRole;