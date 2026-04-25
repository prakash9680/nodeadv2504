require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const createLogger = require('../shared/utils/logger');
const { errorHandler } = require('../shared/middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const sequelize = require('../shared/config/database');

const PORT = process.env.AUTH_PORT || 4001;
const logger = createLogger('auth-service');

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  const numWorkers = Math.min(os.cpus().length, 4);
  logger.info(`Primary ${process.pid} forking ${numWorkers} workers`);
  for (let i = 0; i < numWorkers; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    logger.warn(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use(express.json());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  app.use('/api/auth', authRoutes);
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth' }));

  app.use(errorHandler('auth-service'));

  sequelize.authenticate()
    .then(() => {
      logger.info('Database connected');
      app.listen(PORT, () => logger.info(`Auth service running on port ${PORT}`));
    })
    .catch((err) => {
      logger.error('DB connection failed', err);
      process.exit(1);
    });
}
