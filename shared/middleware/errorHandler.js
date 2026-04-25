const createLogger = require('../utils/logger');

// --- Base Error ---
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// --- Specific Error Types ---
class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
    this.type = 'VALIDATION_ERROR';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.type = 'NOT_FOUND';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.type = 'AUTHENTICATION_ERROR';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.type = 'AUTHORIZATION_ERROR';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.type = 'CONFLICT';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.type = 'RATE_LIMIT';
  }
}

// --- Normalize third-party errors into AppError ---
function normalizeError(err) {
  // Sequelize validation
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors?.map((e) => e.message).join(', ') || err.message;
    return new ValidationError(messages);
  }

  // Sequelize DB errors
  console.log(err)
  if (err.name === 'SequelizeDatabaseError') {
    return new AppError('Database error', 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File size exceeds the allowed limit');
  }

  return err;
}

// --- Centralized Express error middleware ---
function errorHandler(serviceName) {
  const logger = createLogger(serviceName);

  return (err, req, res, _next) => {
    const normalized = normalizeError(err);
    const statusCode = normalized.statusCode || 500;
    const message = normalized.isOperational ? normalized.message : 'Internal server error';

    logger.error(normalized.message, {
      type: normalized.type || 'INTERNAL_ERROR',
      stack: normalized.stack,
      path: req.path,
      method: req.method,
      statusCode,
    });

    res.status(statusCode).json({
      success: false,
      error: message,
      ...(normalized.type && { type: normalized.type }),
      ...(process.env.NODE_ENV === 'development' && { stack: normalized.stack }),
    });
  };
}

// --- Async wrapper ---
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
};
