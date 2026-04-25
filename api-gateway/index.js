require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const createLogger = require('../shared/utils/logger');

const PORT = process.env.GATEWAY_PORT || 4000;
const logger = createLogger('api-gateway');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Service routes
const services = {
  '/api/auth': `http://localhost:${process.env.AUTH_PORT || 4001}`,
  '/api/documents': `http://localhost:${process.env.DOCUMENT_PORT || 4002}`,
  '/api/notifications': `http://localhost:${process.env.NOTIFICATION_PORT || 4004}`,
  '/api/vendors': `http://localhost:${process.env.VENDOR_PORT || 4005}`,
  '/api/products': `http://localhost:${process.env.PRODUCT_PORT || 4006}`,
  '/api/orders': `http://localhost:${process.env.ORDER_PORT || 4007}`,
};

for (const [path, target] of Object.entries(services)) {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${path}`, err);
        res.status(502).json({ error: 'Service unavailable' });
      },
    })
  );
}

// Health check aggregator
app.get('/health', async (_, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => logger.info(`API Gateway running on port ${PORT}`));
