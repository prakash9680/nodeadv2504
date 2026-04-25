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
const productRoutes = require('./routes/productRoutes');
const sequelize = require('../shared/config/database');

const PORT = process.env.PRODUCT_PORT || 4006;
const logger = createLogger('vendor-service');


const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use('/api/products', productRoutes);

app.use(errorHandler('product-service'));

sequelize.authenticate()
.then(() => {
  logger.info('Database connected');
  app.listen(PORT, () => logger.info(`Product service running on port ${PORT}`));
})
.catch((err) => {
  logger.error('DB connection failed', err);
  process.exit(1);
});
