require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const createLogger = require('../shared/utils/logger');
const { errorHandler } = require('../shared/middleware/errorHandler');
const documentRoutes = require('./routes/documentRoutes');
const sequelize = require('../shared/config/database');

const PORT = process.env.DOCUMENT_PORT || 4002;
const logger = createLogger('document-service');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());

app.use('/api/documents', documentRoutes);

app.use(errorHandler('document-service'));

sequelize.authenticate()
  .then(() => {
    logger.info('Database connected');
    app.listen(PORT, () => logger.info(`Document service running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('DB connection failed', err);
    process.exit(1);
  });
