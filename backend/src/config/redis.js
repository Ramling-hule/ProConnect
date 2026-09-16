import { createClient } from 'redis';
import { env } from './env.js';
const redisClient = createClient({
    url: env.redisUrl,
    socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
            if (retries >= 3) {
                console.warn('⚠️  Redis: giving up after 3 retries. Sessions will use memory store.');
                return false;
            }
            return Math.min(retries * 500, 2000);
        }
    }
});

redisClient.on('error', (err) => {
    console.warn('Redis unavailable:', err.message);
});
redisClient.on('connect', () => console.log('✅ Redis client connected'));

const initRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.warn('⚠️  Redis not reachable — running without Redis (memory sessions).');
    }
};

initRedis();

export default redisClient;
