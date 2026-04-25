const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const createLogger = (serviceName) => {
  const logDir = path.join(__dirname, '..', 'logs');

  const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    defaultMeta: { service: serviceName },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.DailyRotateFile({
        filename: path.join(logDir, `${serviceName}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new winston.transports.DailyRotateFile({
        filename: path.join(logDir, `${serviceName}-error-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
      }),
    ],
  });

  // Sentry/Datadog hook point
  // if (process.env.SENTRY_DSN) {
  //   const Sentry = require('@sentry/node');
  //   Sentry.init({ dsn: process.env.SENTRY_DSN });
  //   logger.on('data', (log) => {
  //     if (log.level === 'error') Sentry.captureException(new Error(log.message));
  //   });
  // }

  return logger;
};

module.exports = createLogger;
