import redisClient from '../config/redis.js';
class CacheService {
  get redisClient() {
    return redisClient;
  }

  async setSession(userId, sessionId, ttlSeconds, payload) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.setEx(
        `session:active:${userId}:${sessionId}`,
        ttlSeconds,
        JSON.stringify(payload),
      );
    } catch (err) {
      console.error('Redis setSession error:', err.message);
    }
  }

  async deleteSession(userId, sessionId = '*') {
    if (!redisClient.isReady) return;
    try {
      const keys = await redisClient.keys(`session:active:${userId}:${sessionId}`);
      if (keys.length > 0) await redisClient.del(keys);
    } catch (err) {
      console.error('Redis deleteSession error:', err.message);
    }
  }

  async deleteSessionByIp(userId, ip) {
    if (!redisClient.isReady) return;
    try {
      const keys = await redisClient.keys(`session:active:${userId}:*`);
      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData && JSON.parse(sessionData).ip === ip) {
          await redisClient.del(key);
        }
      }
    } catch (err) {
      console.error('Redis deleteSessionByIp error:', err.message);
    }
  }
  async acquireLock(key, value, ttlSeconds) {
    if (!redisClient.isReady) {
      return true;
    }
    try {
      const result = await redisClient.set(key, value, { NX: true, EX: ttlSeconds });
      return result === 'OK';
    } catch (err) {
      console.error('Redis acquireLock error:', err.message);
      return true;
    }
  }
  async releaseLock(key) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error('Redis releaseLock error:', err.message);
    }
  }
  async get(key) {
    if (!redisClient.isReady) return null;
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Redis get error:', err.message);
      return null;
    }
  }
  async set(key, value, ttlSeconds) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.warn('Redis set error:', err.message);
    }
  }
  async del(...keys) {
    if (!redisClient.isReady) return;
    try {
      await redisClient.del(keys);
    } catch (err) {
      console.warn('Redis del error:', err.message);
    }
  }
}

export default new CacheService();
