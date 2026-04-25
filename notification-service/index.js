require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const createLogger = require('../shared/utils/logger');
const { errorHandler } = require('../shared/middleware/errorHandler');
const notificationRoutes = require('./routes/notificationRoutes');
const sequelize = require('../shared/config/database');

const PORT = process.env.NOTIFICATION_PORT || 4004;
const logger = createLogger('notification-service');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/notifications', notificationRoutes);

app.use(errorHandler('notification-service'));

sequelize.authenticate()
  .then(() => {
    logger.info('Database connected');
    app.listen(PORT, () => logger.info(`Notification service running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('Failed to start notification service', err);
    process.exit(1);
  });
