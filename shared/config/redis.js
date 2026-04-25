require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const Redis = require('ioredis');
const createLogger = require('../utils/logger');
const logger = createLogger('redis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', err));

// Cache helper
const cache = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  async set(key, value, ttlSeconds = 300) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },
  async del(key) {
    await redis.del(key);
  },
  async delPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },
};

module.exports = { redis, cache };
