require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const createLogger = require('../shared/utils/logger');
const { errorHandler } = require('../shared/middleware/errorHandler');
const orderRoutes = require('./routes/orderRoutes');
const sequelize = require('../shared/config/database');

const PORT = process.env.ORDER_PORT || 4007;
const logger = createLogger('order-service');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());

app.use('/api/orders', orderRoutes);

app.use(errorHandler('order-service'));

sequelize.authenticate()
  .then(() => {
    logger.info('Database connected');
    app.listen(PORT, () => logger.info(`Order service running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('DB connection failed', err);
    process.exit(1);
  });
