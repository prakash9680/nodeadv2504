require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const jwt = require('jsonwebtoken');
const { redis } = require('../config/redis');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AuthenticationError('Access token required'));
  }

  try {
    const token = header.split(' ')[1];

    // Check if token is blacklisted (logged out)
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) return next(new AuthenticationError('Token has been revoked'));

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(err);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AuthorizationError());
    }
    next();
  };
}

module.exports = { authenticate, authorize };
